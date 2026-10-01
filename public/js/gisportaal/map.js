/**
 * GIS Portaal - ArcGIS map logic.
 *
 * Depends on the ArcGIS JS SDK (loaded in the layout) and on
 * window.GISPortaalConfig (set inline in the Blade view) for the
 * ArcGIS client id.
 */
$arcgis.import([
    "@arcgis/core/config.js",
    "@arcgis/core/WebMap.js",
    "@arcgis/core/Map.js",
    "@arcgis/core/core/reactiveUtils.js",
    "@arcgis/core/identity/OAuthInfo.js",
    "@arcgis/core/identity/IdentityManager.js"
]).then(function ([esriConfig, WebMap, EsriMap, reactiveUtils, OAuthInfo, esriId]) {

    const config = window.GISPortaalConfig || {};
    const portalUrl = (config.portalUrl || "https://www.arcgis.com").replace(/\/+$/, "");

    esriConfig.portalUrl = portalUrl;

    const info = new OAuthInfo({
        appId: config.arcgisClientId,
        portalUrl: portalUrl,
        popup: false
    });

    esriId.registerOAuthInfos([info]);

    // Reuse the token from the server-side login; hosted services report www.arcgis.com as owning system.
    if (config.arcgisToken) {
        new Set([portalUrl, "https://www.arcgis.com"]).forEach(function (server) {
            esriId.registerToken({
                server: server + "/sharing/rest",
                token: config.arcgisToken,
                userId: config.arcgisUsername,
                expires: config.arcgisTokenExpires,
                ssl: true
            });
        });
    }

    const DEFAULT_CENTER = [4.3813, 52.0000]; // Netherlands
    // Use scale instead of zoom: zoom levels are relative to the
    // basemap's tile scheme (a Dutch RD basemap's level 10 is far more
    // zoomed in than Web Mercator's level 10). Scale is absolute.
    const DEFAULT_SCALE = 160000; // ~whole Netherlands in view

    const mapEl = document.getElementById("main-map");
    const layerList = document.getElementById("layerList");
    const assistantExpand = document.getElementById("assistantExpand");

    // The assistant requires a WebMap with a portal item and reads it on init, so recreate it per map.
    async function mountAssistant(webMap) {
        const old = assistantExpand.querySelector("arcgis-assistant");
        if (old) old.remove();
        assistantExpand.style.display = "none";

        if (!(await hasEmbeddings(webMap.portalItem)) || mapEl.map !== webMap) {
            return;
        }

        const assistant = document.createElement("arcgis-assistant");
        assistant.referenceElement = mapEl;
        assistant.heading = "My Assistant";
        assistant.description = "Explore and navigate this map using natural language";
        assistant.append(
            document.createElement("arcgis-assistant-navigation-agent"),
            document.createElement("arcgis-assistant-data-exploration-agent")
        );

        assistantExpand.appendChild(assistant);
        assistantExpand.style.display = "";
    }

    // Embeddings are generated in AGOL: item Settings > "Manage AI vector embeddings".
    async function hasEmbeddings(portalItem) {
        try {
            const { resources } = await portalItem.fetchResources({ num: 100 });
            const found = resources.some(r => (r.resource.path || "").endsWith("embeddings-v01.json"));
            if (!found) {
                console.info(`AI-assistent uitgeschakeld: web map ${portalItem.id} heeft geen embeddings.`);
            }
            return found;
        } catch (e) {
            console.warn("Kon resources van web map niet ophalen:", e);
            return false;
        }
    }

    // Attach a Legend panel to each list item
    layerList.listItemCreatedFunction = function (event) {
        const item = event.item;
        const legend = document.createElement("arcgis-legend");
        legend.view = mapEl.view;
        legend.layerInfos = [{ layer: item.layer }];
        item.panel = {
            content: legend,
            icon: "legend",
            open: false
        };
    };

    // Default map shown before any Web Map is selected
    mapEl.map = new EsriMap({ basemap: "topo" });
    mapEl.center = DEFAULT_CENTER;
    mapEl.scale = DEFAULT_SCALE;
    mapEl.viewOnReady().then(function () {
        window.arcgisView = mapEl.view;
    });

    /**
     * Compute the union extent of all feature layers, hide layers first,
     * zoom to the extent, then reveal layers.
     */
    async function zoomToFeatures(webMap, v) {

        // Remembers each operational layer's saved visibility (from the Web Map
        // definition, e.g. "visibility": false) so we can restore it after
        // navigating — even if an error occurs midway.
        const visibilityMap = new Map();

        try {

            await webMap.loadAll();
            // The view re-initialises after a map swap; wait so spatialReference matches the new map.
            await reactiveUtils.whenOnce(() => v.ready);
            const featureLayers = webMap.allLayers
                .filter(l => l.type === "feature")
                .toArray();

            // 1. Hide all operational layers so the view shows only the
            //    basemap while we query and navigate.
            webMap.allLayers
                .filter(l => l.type !== "tile" && l.type !== "vector-tile")
                .forEach(function (l) {
                    visibilityMap.set(l, l.visible);
                    l.visible = false;
                });

            // 2. Query the extent of all feature layers.
            const extents = await Promise.all(featureLayers.map(async (layer) => {
                try {
                    const query = layer.createQuery();
                    query.outSpatialReference = v.spatialReference;
                    const result = await layer.queryExtent(query);
                    return (result.count > 0 && result.extent) ? result.extent : null;
                } catch (e) {
                    return null;
                }
            }));

            let union = null;
            extents.forEach(function (ext) {
                if (ext) union = union ? union.union(ext) : ext.clone();
            });

            // 3. Navigate to the bounding box (or default if no features).
            if (union) {
                const MIN_SIZE = 500;
                if (union.width < MIN_SIZE || union.height < MIN_SIZE) {
                    const cx = (union.xmin + union.xmax) / 2;
                    const cy = (union.ymin + union.ymax) / 2;
                    union.xmin = cx - MIN_SIZE / 2;
                    union.xmax = cx + MIN_SIZE / 2;
                    union.ymin = cy - MIN_SIZE / 2;
                    union.ymax = cy + MIN_SIZE / 2;
                }
                await v.goTo(union.expand(1.2), { animate: false });
            }

            // 4. Now restore original layer visibility so features appear.
            visibilityMap.forEach(function (wasVisible, layer) {
                layer.visible = wasVisible;
            });

        } catch (e) {
            console.error("zoomToFeatures failed:", e);
            // Fallback: restore each layer's saved visibility (respecting
            // layers set to "visibility": false in the Web Map). Only force
            // visible when we never captured the original state.
            if (visibilityMap.size > 0) {
                visibilityMap.forEach(function (wasVisible, layer) {
                    layer.visible = wasVisible;
                });
            } else {
                webMap.allLayers.forEach(l => { l.visible = true; });
            }
        }
    }

    /**
     * Load a saved AGOL Web Map (with all its layers, styles and
     * definition expressions) into the map component.
     */
    window.loadWebMap = async function (itemId, title) {
        const label = document.getElementById('mapLabel');
        if (label) {
            label.textContent = title || '';
            label.style.display = title ? 'block' : 'none';
        }

        const webMap = new WebMap({
            portalItem: { id: itemId }
        });

        await mapEl.viewOnReady();
        mapEl.map = webMap;

        webMap.when(function () {
            if (mapEl.map === webMap) mountAssistant(webMap);
            zoomToFeatures(webMap, mapEl.view);
        });
    };

});
