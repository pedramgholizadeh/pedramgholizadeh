(function () {
  'use strict';

  const PROJECTS_URL = 'projects.json';
  const REPOS_URL = 'data/open-source.json';
  const ARROW = '<svg class="arrow-right" aria-hidden="true"><use href="#i-arrow"></use></svg>';

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escape = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

  // No logo in projects.json gets a letter tile instead, so the site never
  // reaches outside this repository for an image.
  function visual(options) {
    if (!options.image) {
      return '<div class="img"><div class="proj-monogram" aria-hidden="true">' + escape(options.title.slice(0, 1)) + '</div></div>';
    }
    return [
      '<div class="img">',
      '  <a href="' + escape(options.href) + '" target="_blank" rel="noopener noreferrer">',
      '    <img src="' + escape(options.image) + '" alt="' + escape(options.title) + '" width="760" height="400" class="radius-5" loading="lazy" decoding="async">',
      '  </a>',
      '</div>',
    ].join('\n');
  }

  function card(options) {
    return [
      '<div class="col-lg-4 col-md-6">',
      '  <div class="item mt-50">',
      visual(options),
      '    <div class="cont mt-30 d-flex align-items-start">',
      '      <div>',
      '        <span class="tag">' + escape(options.tag) + '</span>',
      '        <h6 class="line-height-1"><a href="' + escape(options.href) + '" target="_blank" rel="noopener noreferrer">' + escape(options.title) + '</a></h6>',
      options.summary ? '        <p class="fz-13 projects-summary">' + escape(options.summary) + '</p>' : '',
      options.stars ? '        <p class="fz-13 projects-stars"><svg class="icon-star" aria-hidden="true"><use href="#i-star"></use></svg>' + escape(options.stars) + '</p>' : '',
      '      </div>',
      '      <div class="ml-auto">',
      '        <div class="arrow">',
      '          <a href="' + escape(options.href) + '" target="_blank" rel="noopener noreferrer">' + ARROW + '</a>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
    ]
      .filter(Boolean)
      .join('\n');
  }

  function showState(container, key, englishText) {
    container.innerHTML =
      '<div class="col-12">' +
      '  <p class="text-center fz-15 projects-state" data-i18n="state.' + key + '">' + escape(englishText) + '</p>' +
      '</div>';
    return container.querySelector('.projects-state');
  }

  function showRetry(container, load) {
    const paragraph = document.createElement('p');
    paragraph.className = 'text-center mt-20';
    paragraph.innerHTML = '<button type="button" class="butn butn-sm butn-bord radius-5" data-i18n="state.retry">Retry</button>';
    paragraph.querySelector('button').addEventListener('click', load);
    container.querySelector('.col-12').appendChild(paragraph);
  }

  // projects.json has no Arabic name field, so Arabic falls back to the English one.
  function ownName(project, lang) {
    return lang === 'fa' && project.nameFa ? project.nameFa : project.nameEn;
  }

  function render(container, cards) {
    container.innerHTML = cards.join('\n');
  }

  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(url + ' responded ' + response.status);
      return response.json();
    });
  }

  let projectsCache = null;
  let reposCache = null;

  function loadProjects() {
    if (projectsCache) return Promise.resolve(projectsCache);
    return getJson(PROJECTS_URL).then(function (data) {
      projectsCache = (data.projects || []).filter(function (project) {
        return project.domain && (project.nameEn || project.nameFa);
      });
      return projectsCache;
    });
  }

  function renderProjects(projects, lang) {
    render(
      document.querySelector('[data-projects="owned"]'),
      projects.map(function (project) {
        return card({
          href: 'https://' + project.domain,
          image: project.logo,
          tag: project.domain,
          title: ownName(project, lang),
          summary: project.description,
        });
      })
    );
  }

  function loadProjectsSection(container) {
    showState(container, 'loading', 'Loading…');
    return loadProjects()
      .then(function (projects) {
        if (!projects.length) return showState(container, 'empty', 'Nothing here yet.');
        renderProjects(projects, window.siteLang.get());
      })
      .catch(function (error) {
        console.error(error);
        showState(container, 'error', 'Could not load projects.json.');
        showRetry(container, function () {
          projectsCache = null;
          loadProjectsSection(container);
        });
      });
  }

  function loadRepos(container) {
    showState(container, 'loading', 'Loading…');
    const work = reposCache ? Promise.resolve(reposCache) : getJson(REPOS_URL).then(function (data) {
      reposCache = data.repos || [];
      return reposCache;
    });

    return work
      .then(function (repos) {
        if (!repos.length) return showState(container, 'empty', 'Nothing here yet.');
        render(
          container,
          repos.map(function (repo) {
            return card({
              href: repo.url,
              image: '',
              tag: repo.language || 'Open Source',
              title: repo.name,
              summary: repo.description,
              stars: repo.stars,
            });
          })
        );
      })
      .catch(function (error) {
        console.error(error);
        showState(container, 'error', 'Could not load data/open-source.json.');
        showRetry(container, function () {
          reposCache = null;
          loadRepos(container);
        });
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const owned = document.querySelector('[data-projects="owned"]');
    const repos = document.querySelector('[data-projects="oss"]');

    if (owned) loadProjectsSection(owned);
    if (repos) loadRepos(repos);

    if (owned) {
      window.siteLang.onChange(function (lang) {
        if (projectsCache) renderProjects(projectsCache, lang);
      });
    }

    // Cards injected above carry data-i18n keys, so translate them too.
    window.siteLang.refresh();
  });
})();
