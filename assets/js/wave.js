// The hero particle wave is decoration, so it is fetched once the page is idle
// and skipped entirely for reduced-motion visitors.
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Resolved from this file's own URL, so pages at any depth can share the loader.
  var here = new URL('.', document.currentScript.src).href;

  function load(file, done) {
    var script = document.createElement('script');
    script.src = here + file;
    if (done) script.onload = done;
    document.body.appendChild(script);
  }

  function start() {
    load('three.min.js', function () {
      load('cdemo.js');
    });
  }

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 1500);
})();
