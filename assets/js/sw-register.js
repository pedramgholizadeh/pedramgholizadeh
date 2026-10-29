// sw.js must stay at the repository root to own the whole site, so its URL is
// resolved from this file instead of hardcoding a domain or a sub-path.
// The deploy version rides along as a query string: Cloudflare caches sw.js like
// any other script, and a worker kept at the edge is a worker that keeps serving
// stale translations. updateViaCache stops the browser layering its own copy on
// top of that, so the URL is the only thing deciding which worker runs.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  var workerUrl = new URL('../../sw.js', document.currentScript.src);
  if (window.SITE_VERSION) workerUrl.search = 'v=' + window.SITE_VERSION;
  navigator.serviceWorker
    .register(workerUrl.href, { scope: '/', updateViaCache: 'none' })
    .catch(function () {
      // A blocked or unreachable worker leaves the site working; nothing to report.
    });
}
