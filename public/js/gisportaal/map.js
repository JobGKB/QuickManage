/**
 * GIS Portaal - ArcGIS map logic.
 *
 * Depends on the ArcGIS JS SDK (loaded in the layout) and on
 * window.GISPortaalConfig (set inline in the Blade view) for the
 * ArcGIS client id.
 */
require([
    "esri/WebMap",
    "esri/Map",
    "esri/views/MapView",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "esri/widgets/LayerList",
    "esri/widgets/Expand",
    "esri/widgets/Legend"
], function (WebMap, Map, MapView, OAuthInfo, esriId, LayerList, Expand, Legend) {

    const config = window.GISPortaalConfig || {};

    const info = new OAuthInfo({
        appId: config.arcgisClientId,
        popup: false
    });

    esriId.registerOAuthInfos([info]);

    const DEFAULT_CENTER = [4.3813, 52.0000]; // Netherlands
    // Use scale instead of zoom: zoom levels are relative to the
    // basemap's tile scheme (a Dutch RD basemap's level 10 is far more
    // zoomed in than Web Mercator's level 10). Scale is absolute.
    const DEFAULT_SCALE = 180000; // ~whole Netherlands in view

    let view = null;

    // Create a fresh MapView for the given map. Passing center/scale in
    // the constructor overrides any viewpoint saved in the WebMap and
    // discards previous navigation state completely.
    function createView(map) {

        view = new MapView({
            container: document.querySelector(".defaultMap"),
            map: map,
            center: DEFAULT_CENTER,
            scale: DEFAULT_SCALE
        });

        view.when(function () {
            // Use LayerListViewModel for full state control
            const layerList = new LayerList({
                view: view,
                visibleElements: {
                    collapseButton: false,
                    heading: false,
                    statusIndicators: true,
                    filter: false
                },
                collapsed: false,
                // Attach a Legend panel to each list item
                listItemCreatedFunction: function (event) {
                    const item = event.item;
                    item.panel = {
                        content: new Legend({
                            view: view,
                            layerInfos: [{
                                layer: item.layer
                            }]
                        }),
                        className: "esri-icon-legend",
                        open: false
                    };
                }
            });

            // Wrap in Expand so it renders as a toggle button in the map
            const expand = new Expand({
                view: view,
                content: layerList,
                expandIcon: "layers",
                collapseIcon: "layers",
                expanded: false
            });

            view.ui.add(expand, "bottom-right");
        });

        window.arcgisView = view;
        return view;
    }

    // Default map shown before any Web Map is selected
    createView(new Map({ basemap: "topo" }));

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
            await v.when();
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
     * definition expressions) into a fresh MapView.
     */
    window.loadWebMap = function (itemId, title) {
        const label = document.getElementById('mapLabel');
        if (label) {
            label.textContent = title || '';
            label.style.display = title ? 'block' : 'none';
        }

        const webMap = new WebMap({
            portalItem: { id: itemId }
        });

        const v = createView(webMap);

        webMap.when(function () {
            zoomToFeatures(webMap, v);
        });
    };

});
