(function () {
  if (window.__visitorHeartbeatLoaded) {
    return;
  }
  window.__visitorHeartbeatLoaded = true;

  var INACTIVITY_MS =  25000;
  var HEARTBEAT_MS = 5000;
  var lastActivityAt = Date.now();
  var lastHeartbeatAt = 0;

  function currentPagePath() {
    var path = window.location.pathname || '';
    return path.replace(/^\/+/, '');
  }

  function sendHeartbeat(force) {
    var now = Date.now();

    if (document.visibilityState === 'hidden') {
      return;
    }

    if (!force && now - lastActivityAt >= INACTIVITY_MS) {
      return;
    }

    if (!force && now - lastHeartbeatAt < HEARTBEAT_MS) {
      return;
    }

    lastHeartbeatAt = now;

    var url = '/visit-heartbeat?page_url=' + encodeURIComponent(currentPagePath());

    fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Accept': 'application/json' }
    }).catch(function () {
      // Ignore transient network failures.
    });
  }

  function onActivity() {
    lastActivityAt = Date.now();
    sendHeartbeat(false);
  }

  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'].forEach(function (eventName) {
    window.addEventListener(eventName, onActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      onActivity();
    }
  });

  sendHeartbeat(true);
  setInterval(function () {
    sendHeartbeat(false);
  }, HEARTBEAT_MS);
})();
