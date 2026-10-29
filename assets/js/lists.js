(function () {
  'use strict';

  // Two JSON snapshots in this repository feed the two lists below. The site
  // never talks to an API at runtime; tools/refresh-data.mjs regenerates them.
  const SOURCES = {
    own: { url: 'services.json', key: 'services' },
    repos: { url: 'data/open-source.json', key: 'repos' },
  };

  // GitHub's own language colours, so a dot means the same thing here as there.
  const LANGUAGE_COLORS = {
    PHP: '#4f5d95',
    JavaScript: '#f1e05a',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Dart: '#00b4ab',
    Astro: '#d5ace3',
    TypeScript: '#3178c6',
    Python: '#3572a5',
    Go: '#00add8',
    Shell: '#89e051',
  };

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escape = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

  // Every item carries one field per language (nameEn / nameFa / nameAr) and,
  // for repositories, a bare English field as the fallback.
  function localized(item, base, lang) {
    const suffix = lang.charAt(0).toUpperCase() + lang.slice(1);
    const value = item[base + suffix];
    return value == null || value === '' ? item[base] : value;
  }

  function stateRow(node, key, text) {
    node.innerHTML = '<li class="data-state" data-i18n="state.' + key + '">' + escape(text) + '</li>';
  }

  function retryRow(node, load, errorText) {
    node.innerHTML =
      '<li class="data-state">' +
      '<span data-i18n="state.error">' + escape(errorText) + '</span> ' +
      '<button type="button" class="butn butn-sm butn-bord radius-5" data-i18n="state.retry">Retry</button>' +
      '</li>';
    node.querySelector('button').addEventListener('click', load);
  }

  function row(title, href, description, meta) {
    return [
      '<li class="data-row">',
      '  <a class="data-row__title" href="' + escape(href) + '" target="_blank" rel="noopener noreferrer">' + escape(title) + '</a>',
      description ? '  <p class="data-row__desc">' + escape(description) + '</p>' : '',
      '  <div class="data-row__meta">' + meta + '</div>',
      '</li>',
    ]
      .filter(Boolean)
      .join('\n');
  }

  function ownRow(service, lang) {
    return row(
      localized(service, 'name', lang),
      'https://' + service.domain,
      localized(service, 'description', lang),
      '<span class="data-row__domain">' + escape(service.domain) + '</span>'
    );
  }

  function repoRow(repo, lang) {
    const t = window.siteLang.t;
    const color = LANGUAGE_COLORS[repo.language];
    const language = repo.language
      ? '<span class="data-row__lang">' +
        (color ? '<i class="lang-dot" aria-hidden="true" style="background:' + color + '"></i>' : '') +
        escape(repo.language) +
        '</span>'
      : '';
    const stars = '<span class="data-row__stars" aria-label="' + escape(t('repos.stars', 'stars')) + '">' + '<svg class="icon-star" aria-hidden="true"><use href="#i-star"></use></svg>' + escape(repo.stars) + '</span>';
    return row(repo.name, repo.url, localized(repo, 'description', lang), language + stars);
  }

  const RENDERERS = { own: ownRow, repos: repoRow };

  function load(node, name) {
    const source = SOURCES[name];
    const t = window.siteLang.t;
    stateRow(node, 'loading', t('state.loading', 'Loading…'));

    fetch(source.url)
      .then(function (response) {
        if (!response.ok) throw new Error(source.url + ' responded ' + response.status);
        return response.json();
      })
      .then(function (data) {
        const items = data[source.key] || [];
        node.dataset.items = JSON.stringify(items);
        paint(node, name);
      })
      .catch(function (error) {
        console.error(error);
        retryRow(node, function () {
          load(node, name);
        }, t('state.error', 'Could not load this right now.'));
      });
  }

  // Items stay in memory, only the language changes, so switching language
  // re-renders without fetching the JSON again.
  function paint(node, name) {
    const items = JSON.parse(node.dataset.items || '[]');
    const lang = window.siteLang.get();
    if (!items.length) {
      stateRow(node, 'empty', window.siteLang.t('state.empty', 'Nothing here yet.'));
      return;
    }
    node.innerHTML = items.map(function (item) {
      return RENDERERS[name](item, lang);
    }).join('\n');
  }

  document.addEventListener('DOMContentLoaded', function () {
    Object.keys(SOURCES).forEach(function (name) {
      const node = document.querySelector('[data-list="' + name + '"]');
      if (node) load(node, name);
    });

    window.siteLang.onChange(function () {
      Object.keys(SOURCES).forEach(function (name) {
        const node = document.querySelector('[data-list="' + name + '"]');
        if (node && node.dataset.items) paint(node, name);
      });
    });
  });
})();
