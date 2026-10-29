#!/usr/bin/env node
// Regenerates the local data snapshots the site ships with.
//
//   node tools/refresh-data.mjs            # both sources
//   node tools/refresh-data.mjs --repos    # only data/open-source.json
//   node tools/refresh-data.mjs --services # only check services.json
//
// The site never calls an external API at runtime; it reads the files this
// script writes, so re-running it and committing the output is the only way
// the repository list changes. services.json is different: it is the list of
// services I own, written by hand, and this script only checks it.
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

// services.json is my own list, edited by hand, so this never rewrites it. It
// only reports entries that apps.webiro.ir no longer links to.
async function checkServices() {
  const services = (await readJson('services.json', { services: [] })).services;

  let html = '';
  try {
    const page = await fetch(APPS_URL, { headers: { 'User-Agent': 'pedramgholizadeh-site' } });
    if (!page.ok) throw new Error(`${APPS_URL} responded ${page.status}`);
    html = await page.text();
  } catch (error) {
    console.warn(`Could not read ${APPS_URL}: ${error.message} — nothing was checked.`);
    return;
  }

  const address = (service) => {
    const url = new URL(service.url);
    return (url.host + url.pathname).replace(/^www\./, '').replace(/\/$/, '');
  };

  console.log(`services.json lists ${services.length} services and was left untouched.`);

  // The grid is rendered by a script, so a page with no cards in its HTML says
  // nothing about the list; only a server-rendered page can be compared against it.
  if (!html.includes('<article class="card')) {
    console.warn(`${APPS_URL} served no service cards, so nothing could be verified.`);
    return;
  }

  const missing = services.filter((service) => !html.includes(address(service)));
  if (missing.length) {
    console.log(`Not linked from apps.webiro.ir anymore: ${missing.map(address).join(', ')}`);
  } else {
    console.log('Every service in services.json is still linked from apps.webiro.ir.');
  }
}

if (only.includes('--repos')) await refreshRepos();
if (only.includes('--services')) await checkServices();
