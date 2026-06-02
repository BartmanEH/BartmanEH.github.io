#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1000;
const START_DATE_UTC = Date.UTC(2021, 5, 19);
const DEFAULT_CONCURRENCY = 10;
const REQUEST_TIMEOUT_MS = 12_000;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '../..');
const solverPath = path.join(repoRoot, 'Wordle_Solver/Wordle_Solver.js');

function usage() {
  console.log(`Usage: node Wordle_Solver/scripts/check-nyt-solutions.mjs [options]

Compare aryAllAnswersOrdered against the NYT Wordle API.

Options:
  --from INDEX|YYYY-MM-DD   first answer to check (default: 0)
  --to INDEX|YYYY-MM-DD     last answer to check, inclusive (default: last built-in answer)
  --concurrency N           concurrent API requests (default: ${DEFAULT_CONCURRENCY})
  --show-ok                 include matching rows in output
  --json                    output JSON instead of text
  --help                    show this help

Examples:
  npm run check:wordle-solutions
  npm run check:wordle-solutions -- --from 2025-01-01 --to 2025-12-31
  node Wordle_Solver/scripts/check-nyt-solutions.mjs --from 1500 --show-ok`);
}

function parseArguments(argv) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    from: '0',
    json: false,
    showOk: false,
    to: null
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--show-ok') {
      options.showOk = true;
    } else if (argument === '--json') {
      options.json = true;
    } else if (argument === '--from' || argument === '--to' || argument === '--concurrency') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
      index++;
      if (argument === '--from') options.from = value;
      if (argument === '--to') options.to = value;
      if (argument === '--concurrency') options.concurrency = Number(value);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error('--concurrency must be a positive integer');
  }

  return options;
}

async function loadBuiltInAnswers() {
  const source = await fs.readFile(solverPath, 'utf8');
  const match = source.match(/const aryAllAnswersOrdered = \[([\s\S]*?)\];/);
  if (!match) throw new Error(`Could not find aryAllAnswersOrdered in ${solverPath}`);

  const answers = [...match[1].matchAll(/'([A-Z]{5})'/g)].map((answerMatch) => answerMatch[1]);
  if (answers.length === 0) throw new Error('aryAllAnswersOrdered was found but no answers were parsed');

  return answers;
}

function dateForIndex(index) {
  return new Date(START_DATE_UTC + index * DAY_MS).toISOString().slice(0, 10);
}

function indexForDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date: ${dateString}. Expected YYYY-MM-DD`);
  }

  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${dateString}`);

  return Math.round((date.getTime() - START_DATE_UTC) / DAY_MS);
}

function parseIndexOrDate(value, maxIndex) {
  if (value === null) return maxIndex;
  if (/^\d+$/.test(value)) return Number(value);
  return indexForDate(value);
}

async function fetchNytSolution(date) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = `https://www.nytimes.com/svc/wordle/v2/${date}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Wordle-Solver answer audit'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        error: `HTTP ${response.status} ${response.statusText}`.trim(),
        solution: ''
      };
    }

    const body = await response.json();
    return {
      editor: body.editor ?? '',
      id: body.id ?? '',
      solution: typeof body.solution === 'string' ? body.solution.toUpperCase() : ''
    };
  } catch (error) {
    const message = error.name === 'AbortError' ? `timeout after ${REQUEST_TIMEOUT_MS}ms` : error.message;
    return {
      error: message,
      solution: ''
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function resultStatus(result) {
  if (result.error) return 'api-error';
  if (!result.nyt) return 'missing-api-solution';
  if (result.builtIn !== result.nyt) return 'mismatch';
  return 'ok';
}

function formatTextReport(results, options) {
  const visibleResults = options.showOk ? results : results.filter((result) => result.status !== 'ok');
  const counts = results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] ?? 0) + 1;
    return summary;
  }, {});

  const lines = [];
  lines.push(`Checked ${results.length} built-in Wordle answers against the NYT API.`);
  lines.push(`ok=${counts.ok ?? 0} mismatch=${counts.mismatch ?? 0} missing-api-solution=${counts['missing-api-solution'] ?? 0} api-error=${counts['api-error'] ?? 0}`);

  if (visibleResults.length > 0) {
    lines.push('');
    lines.push('index,date,builtIn,nyt,status,detail');
    for (const result of visibleResults) {
      lines.push([
        result.index,
        result.date,
        result.builtIn,
        result.nyt,
        result.status,
        result.error || result.editor || ''
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    }
  }

  return lines.join('\n');
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const answers = await loadBuiltInAnswers();
  const fromIndex = parseIndexOrDate(options.from, answers.length - 1);
  const toIndex = parseIndexOrDate(options.to, answers.length - 1);

  if (fromIndex < 0 || fromIndex >= answers.length) throw new Error(`--from is outside aryAllAnswersOrdered: ${fromIndex}`);
  if (toIndex < 0 || toIndex >= answers.length) throw new Error(`--to is outside aryAllAnswersOrdered: ${toIndex}`);
  if (fromIndex > toIndex) throw new Error(`--from (${fromIndex}) must be <= --to (${toIndex})`);

  const items = answers.slice(fromIndex, toIndex + 1).map((builtIn, offset) => {
    const index = fromIndex + offset;
    return {
      builtIn,
      date: dateForIndex(index),
      index
    };
  });

  const results = await mapWithConcurrency(items, options.concurrency, async (item) => {
    const nytResult = await fetchNytSolution(item.date);
    const result = {
      ...item,
      editor: nytResult.editor ?? '',
      error: nytResult.error ?? '',
      id: nytResult.id ?? '',
      nyt: nytResult.solution
    };
    result.status = resultStatus(result);
    return result;
  });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(formatTextReport(results, options));
  }

  if (results.some((result) => result.status !== 'ok')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
