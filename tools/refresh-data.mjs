#!/usr/bin/env node
// Regenerates the local data snapshots the site ships with.
//
//   node tools/refresh-data.mjs            # both sources
//   node tools/refresh-data.mjs --repos    # only data/open-source.json
//   node tools/refresh-data.mjs --services # only services.json
//
// The site never calls an external API at runtime; it reads the files this
// script writes, so re-running it and committing the output is the only way
// data changes. Translations that live only in these files (Persian/Arabic
// names and descriptions) are carried over by name on every run.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const GITHUB_USER = 'pedramgholizadeh';
const APPS_URL = 'https://apps.webiro.ir/';
const MAX_REPOS = 12;
const flags = process.argv.slice(2);
const only = flags.length ? flags : ['--repos', '--services'];

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function refreshRepos() {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'pedramgholizadeh-site' } }
  );

  if (!response.ok) {
    console.error(`GitHub responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
    process.exitCode = 1;
    return;
  }

  const previous = new Map(((await readJson('data/open-source.json', { repos: [] })).repos).map((repo) => [repo.name, repo]));

  // Forks and the profile repository are not "my" open-source projects.
  const repos = (await response.json())
    .filter((repo) => !repo.fork && repo.name !== GITHUB_USER)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, MAX_REPOS)
    .map((repo) => {
      const local = previous.get(repo.name) || {};
      return {
        name: repo.name,
        url: repo.html_url,
        description: repo.description || local.description || null,
        descriptionFa: local.descriptionFa || null,
        descriptionAr: local.descriptionAr || null,
        language: repo.language,
        stars: repo.stargazers_count,
        updated: repo.pushed_at.slice(0, 10),
      };
    });

  await mkdir('data', { recursive: true });
  await writeFile('data/open-source.json', JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), repos }, null, 2) + '\n');

  const untranslated = repos.filter((repo) => !repo.descriptionFa).map((repo) => repo.name);
  console.log(`data/open-source.json written with ${repos.length} repositories.`);
  if (untranslated.length) {
    console.log(`Add descriptionFa/descriptionAr for: ${untranslated.join(', ')}`);
  }
}

async function refreshServices() {
  const previous = (await readJson('services.json', { services: [] })).services;
  const byDomain = new Map(previous.map((service) => [service.domain, service]));

  // apps.webiro.ir renders its grid with a script, so the list is read from the
  // page's JSON endpoint when it answers and from the anchors when it does not.
  let remote = [];
  try {
    const page = await fetch(APPS_URL, { headers: { 'User-Agent': 'pedramgholizadeh-site' } });
    if (!page.ok) throw new Error(`${APPS_URL} responded ${page.status}`);
    const html = await page.text();
    for (const match of html.matchAll(/https?:\/\/((?!apps\.)[a-z0-9.-]+\.[a-z]{2,})/gi)) {
      const domain = match[1].toLowerCase().replace(/^www\./, '');
      if (!remote.some((item) => item.domain === domain)) remote.push({ domain });
    }
  } catch (error) {
    console.warn(`Could not read ${APPS_URL}: ${error.message}`);
  }

  const services = remote
    .map((item) => byDomain.get(item.domain))
    .filter(Boolean);

  if (!services.length) {
    console.warn('No apps.webiro.ir service matched services.json, so it was left untouched.');
    console.warn('Edit services.json by hand to add or change an owned service.');
    return;
  }

  await writeFile('services.json', JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    source: APPS_URL,
    services,
  }, null, 2) + '\n');
  console.log(`services.json kept ${services.length} services found on apps.webiro.ir.`);

  const dropped = previous.filter((service) => !services.includes(service));
  if (dropped.length) {
    console.log(`Not linked from apps.webiro.ir anymore (kept in git history): ${dropped.map((s) => s.domain).join(', ')}`);
  }
}

if (only.includes('--repos')) await refreshRepos();
if (only.includes('--services')) await refreshServices();
