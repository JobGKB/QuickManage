/**
 * GIS Portaal - group / web map list.
 *
 * Handles expanding groups to lazily fetch their web maps, and loading a
 * selected web map into the MapView (via window.loadWebMap from map.js).
 *
 * Depends on window.GISPortaalConfig.groupMapsBaseUrl (set in the Blade view).
 */
(function () {
    const config = window.GISPortaalConfig || {};
    const groupMapsBaseUrl = config.groupMapsBaseUrl;

    // Expand a group and lazily load its web maps.
    document.querySelectorAll('.group-item-header').forEach(function (header) {
        header.addEventListener('click', async function () {
            const groupItem = header.closest('.group-item');
            const groupId = groupItem.dataset.groupId;
            const mapsContainer = groupItem.querySelector('.group-maps');
            const isOpen = groupItem.classList.contains('open');

            // collapse every other group
            document.querySelectorAll('.group-item').forEach(function (item) {
                if (item !== groupItem) {
                    item.classList.remove('open');
                }
            });

            groupItem.classList.toggle('open', !isOpen);

            if (isOpen || !groupId) {
                return;
            }

            if (mapsContainer.dataset.loaded === 'true') {
                return;
            }

            mapsContainer.innerHTML = '<p class="group-maps-status">Laden...</p>';

            try {
                const response = await fetch(`${groupMapsBaseUrl}/${groupId}/maps`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();

                if (!response.ok) {
                    mapsContainer.innerHTML = `<p class="group-maps-status">${data.message || 'Fout bij laden van maps.'}</p>`;
                    return;
                }

                if (!data.maps || data.maps.length === 0) {
                    mapsContainer.innerHTML = '<p class="group-maps-status">Geen maps gevonden.</p>';
                } else {
                    mapsContainer.innerHTML = data.maps.map(function (map) {
                        return `<div class="map-item" data-map-id="${map.id}">${map.title}</div>`;
                    }).join('');
                }

                mapsContainer.dataset.loaded = 'true';
            } catch (error) {
                mapsContainer.innerHTML = '<p class="group-maps-status">Fout bij laden van maps.</p>';
                console.error(error);
            }
        });
    });

    // Click a map item -> load it into the MapView
    const groupList = document.querySelector('.group-list');
    if (groupList) {
        groupList.addEventListener('click', function (e) {
            const mapItem = e.target.closest('.map-item');
            if (!mapItem) return;

            const mapId = mapItem.dataset.mapId;
            const mapTitle = mapItem.textContent.trim();
            if (!mapId) return;

            document.querySelectorAll('.map-item').forEach(function (el) {
                el.classList.remove('active');
            });
            mapItem.classList.add('active');

            if (typeof window.loadWebMap === 'function') {
                window.loadWebMap(mapId, mapTitle);
            }
        });
    }
})();
