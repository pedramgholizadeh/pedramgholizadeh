// sw.js must stay at the repository root to own the whole site, so its URL is
// resolved from this file instead of hardcoding a domain or a sub-path.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  var workerUrl = new URL('../../sw.js', document.currentScript.src).href;
  navigator.serviceWorker.register(workerUrl).catch(function () {
    // A blocked or unreachable worker leaves the site working; nothing to report.
  });
}
