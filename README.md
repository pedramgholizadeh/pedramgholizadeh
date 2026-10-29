

<p align="left"> <img src="https://komarev.com/ghpvc/?username=pedramgholizadeh&label=Profile%20views&color=0e75b6&style=flat" alt="pedramgholizadeh" /> </p>
<h1>
Pedram Gholizadeh
</h1>
<p align="left"> <a href="https://twitter.com/pedramgholizade" target="blank"><img src="https://img.shields.io/twitter/follow/pedramgholizade?logo=twitter&style=for-the-badge" alt="pedramgholizade" /></a> </p>

- 🔭 Personal Web + Resume [Pedram Gholizadeh](https://pedramgholizadeh.ir) 

- 🔭 Project Manager [Webiro Creativity Agency](https://webiro.ir)

- 🌱 I’m currently learning **Everything :D**

- ☕ Buy me a COFFEE! [Donate](https://daramet.com/pedram)

- 📫 How to reach me **pedram@skiff.com** or **09120894404**

- ⚡ Fun fact **there is NO fun fact about my life :)**

<br><br><br>
<p><img align="center" src="https://github-readme-stats.vercel.app/api/top-langs?username=pedramgholizadeh&show_icons=true&locale=en&layout=compact" alt="pedramgholizadeh" /></p>

## Maintaining this site

The site is plain HTML/CSS/JS served by GitHub Pages, and it loads nothing from another host — no Google Fonts, no CDNs, no analytics.

- `services.json` — the services I own, shown under "Services I Own". One entry per service: `domain`, `nameEn`, `nameFa`, `nameAr`, `descriptionEn`, `descriptionFa`, `descriptionAr`. No screenshots: the list is text only, and any language without its own field falls back to English.
- `i18n/en.json`, `i18n/fa.json`, `i18n/ar.json` — every string on the page, including the skill tag lists (which are arrays) and the `aria-label`s; the header switcher picks one and remembers it. English is the default and the copy baked into `index.html`.
- `data/open-source.json` — the repository list, with `descriptionFa` / `descriptionAr` kept by name across refreshes.
- `node tools/refresh-data.mjs` — snapshots my GitHub repos and cross-checks `services.json` against apps.webiro.ir (run before a push when I want fresh stars/descriptions).
- `node tools/fetch-fonts.mjs` — re-vendors the webfonts into `assets/fonts/web` after changing `assets/css/fonts.css` needs.
- `sw.js` — caches what a visitor downloads; translations and JSON go to the network first, code and styles revalidate in the background, images and fonts come from cache. Bump `CACHE` there when a rename must land immediately.
- `linkinbio/` shares `assets/` with the main page, so deleting a shared file there breaks both.

### Why a deploy can look like it did nothing

The domain sits behind Cloudflare, which edge-caches `.js`, `.css` and `.json` for four hours and serves them with `cache-control: max-age=14400` — so an un-versioned URL can keep answering with a copy of the *previous* deploy, and a stale `sw.js` or a stale `i18n/fa.json` is exactly what makes the site "only flip RTL" instead of translating.

The Pages workflow replaces `__SITE_VERSION__` in `index.html` with the commit SHA (HTML itself is not edge-cached). Every script and style tag carries it as `?v=`, and `window.SITE_VERSION` lets `i18n.js` and `lists.js` version their JSON and `sw-register.js` version the worker URL. Cloudflare keys its cache on the full URL, so a new SHA is a guaranteed miss. Nothing to do by hand; if the token ever goes missing the workflow build fails rather than deploy a stale site.

In the Cloudflare dashboard, set a Page Rule or Cache Rule to **Bypass cache for `/sw.js`** — a service worker is the one file that must never come from an edge cache.








