(function () {
  'use strict';

  const SUPPORTED = ['en', 'fa', 'ar'];
  const RIGHT_TO_LEFT = ['fa', 'ar'];
  const FALLBACK = 'en';
  const STORAGE_KEY = 'site.lang';
  const LANG_EVENT = 'site:lang';
  const dictionaries = new Map();
  let current = {};

  function loadDictionary(lang) {
    if (!dictionaries.has(lang)) {
      dictionaries.set(
        lang,
        fetch('i18n/' + lang + '.json').then(function (response) {
          if (!response.ok) throw new Error('i18n/' + lang + '.json responded ' + response.status);
          return response.json();
        })
      );
    }
    return dictionaries.get(lang);
  }

  function letters(text, className) {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var letter = document.createElement('span');
      if (className) letter.className = className;
      letter.textContent = text[i].trim() === '' ? '\u00a0' : text[i];
      fragment.appendChild(letter);
    }
    return fragment;
  }

  // scripts.js rebuilds every .rolling-text into per-letter spans and the
  // preloader splits its word the same way, so a translated label has to
  // rebuild the same structure to keep the animation working.
  function setText(element, text) {
    if (element.classList.contains('load-text')) {
      element.innerHTML = '';
      element.appendChild(letters(text, null));
      return;
    }
    if (!element.classList.contains('rolling-text')) {
      element.textContent = text;
      return;
    }
    element.innerHTML = '';
    var block = document.createElement('div');
    block.className = 'block';
    block.appendChild(letters(text, 'letter'));
    element.appendChild(block);
    element.appendChild(block.cloneNode(true));
  }

  function applyDictionary(dictionary) {
    current = dictionary;

    // data-i18n-html is only ever fed by this site's own dictionary files, which
    // is what lets copy like the about paragraph keep its <b> emphasis.
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var text = dictionary[node.dataset.i18n];
      if (typeof text === 'string') setText(node, text);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      var html = dictionary[node.dataset.i18nHtml];
      if (typeof html === 'string') node.innerHTML = html;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      var label = dictionary[node.dataset.i18nAria];
      if (typeof label === 'string') node.setAttribute('aria-label', label);
    });
    // Skill tags are a list, so they are rebuilt from the dictionary instead of
    // carrying one key per tag.
    document.querySelectorAll('[data-i18n-list]').forEach(function (node) {
      var items = dictionary[node.dataset.i18nList];
      if (!Array.isArray(items)) return;
      node.innerHTML = '';
      items.forEach(function (item) {
        var tag = document.createElement('a');
        tag.href = '#0';
        tag.textContent = item;
        node.appendChild(tag);
      });
    });

    if (dictionary['meta.title']) document.title = dictionary['meta.title'];
    var description = document.querySelector('meta[name="description"]');
    if (description && dictionary['meta.description']) description.content = dictionary['meta.description'];
  }

  function markActiveButton(lang) {
    document.querySelectorAll('.lang-btn').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
  }

  function setLang(lang) {
    var code = SUPPORTED.indexOf(lang) === -1 ? FALLBACK : lang;
    document.documentElement.lang = code;
    document.documentElement.dir = RIGHT_TO_LEFT.indexOf(code) === -1 ? 'ltr' : 'rtl';
    markActiveButton(code);

    return loadDictionary(code)
      .then(applyDictionary)
      .catch(function (error) {
        // The HTML already carries the English copy, so a failed fetch is not fatal.
        console.error('i18n:', error);
      })
      .then(function () {
        localStorage.setItem(STORAGE_KEY, code);
        document.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: { lang: code } }));
      });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.lang-btn');
    if (button) setLang(button.dataset.lang);
  });

  window.siteLang = {
    get: function () {
      return document.documentElement.lang || FALLBACK;
    },
    set: setLang,
    // Rendered-from-JavaScript copy asks the dictionary for a string directly
    // and keeps an English fallback for the moment before it has loaded.
    t: function (key, fallback) {
      return typeof current[key] === 'string' ? current[key] : fallback;
    },
    refresh: function () {
      return loadDictionary(window.siteLang.get()).then(applyDictionary);
    },
    onChange: function (listener) {
      document.addEventListener(LANG_EVENT, function (event) {
        listener(event.detail.lang);
      });
    },
  };

  setLang(localStorage.getItem(STORAGE_KEY) || FALLBACK);
})();
