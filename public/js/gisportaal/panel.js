/**
 * GIS Portaal - control panel resize handle.
 *
 * Lets the user drag the right edge of the control panel to resize it,
 * keeping the map, footer and map label aligned.
 */
(function () {
    const handle = document.getElementById('resizeHandle');
    const panel  = document.getElementById('controlpanel');
    const mapDiv = document.querySelector('.defaultMap');
    const footer = document.querySelector('.footer');
    const MIN_WIDTH = 180;
    const MAX_WIDTH = 600;

    if (!handle || !panel) {
        return;
    }

    let dragging = false;
    let startX, startWidth;

    handle.addEventListener('mousedown', function (e) {
        dragging = true;
        startX = e.clientX;
        startWidth = panel.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        const delta = e.clientX - startX;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
        panel.style.width = newWidth + 'px';
        panel.style.maxWidth = newWidth + 'px';
        if (mapDiv) mapDiv.style.inset = `0 0 0 ${newWidth}px`;
        if (footer) footer.style.width = newWidth + 'px';
        const label = document.getElementById('mapLabel');
        if (label) label.style.left = `calc(${newWidth}px + 50%)`;
        if (window.arcgisView) window.arcgisView.resize();
    });

    document.addEventListener('mouseup', function () {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
})();
