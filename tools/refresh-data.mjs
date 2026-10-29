#!/usr/bin/env node
// Regenerates the local data snapshots the site ships with.
//
//   node tools/refresh-data.mjs
//
// The site never calls an external API at runtime; it reads the files this
// script writes, so re-running it and committing the output is the only way
// data changes.
import { writeFile, mkdir } from 'node:fs/promises';

const GITHUB_USER = 'pedramgholizadeh';
const MAX_REPOS = 12;

const response = await fetch(
  `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
  { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'pedramgholizadeh-site' } }
);

if (!response.ok) {
  console.error(`GitHub responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
  process.exit(1);
}

const repos = await response.json();

// Forks and the profile repository are not "my" open-source projects.
const snapshot = repos
  .filter((repo) => !repo.fork && repo.name !== GITHUB_USER)
  .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
  .slice(0, MAX_REPOS)
  .map((repo) => ({
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    updated: repo.pushed_at.slice(0, 10),
  }));

await mkdir('data', { recursive: true });
await writeFile(
  'data/open-source.json',
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), repos: snapshot }, null, 2) + '\n'
);

console.log(`data/open-source.json written with ${snapshot.length} repositories.`);
