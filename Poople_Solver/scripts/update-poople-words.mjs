import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const POOPLE_URL = 'https://poople.io/';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, '../words.json');
const startWordsOutputPath = path.resolve(scriptDirectory, '../start-words.json');

async function fetchText(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`${url} returned HTTP ${response.status}`);
	}
	return response.text();
}

function extractBundleURL(html) {
	const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"[^>]*>/gi)];
	const match = scripts.find(([, source]) => source.includes('/assets/index-'));
	if (!match) {
		throw new Error('Could not find Poople’s JavaScript bundle');
	}
	return new URL(match[1], POOPLE_URL);
}

function extractWords(bundle) {
	const marker = 'const wordDist=`';
	const start = bundle.indexOf(marker);
	if (start === -1) {
		throw new Error('Could not find wordDist in Poople’s JavaScript bundle');
	}

	const dataStart = start + marker.length;
	const dataEnd = bundle.indexOf('`', dataStart);
	if (dataEnd === -1) {
		throw new Error('Could not find the end of Poople’s wordDist data');
	}

	const rows = bundle
		.slice(dataStart, dataEnd)
		.replaceAll('\\r', '')
		.split('\n')
		.filter(Boolean);

	const words = rows.map(row => {
		const [word, distance] = row.split(',');
		if (!/^[A-Z]{4}$/.test(word) || !/^\d+$/.test(distance)) {
			throw new Error(`Unexpected wordDist row: ${row}`);
		}
		return word.toLowerCase();
	});

	const uniqueWords = new Set(words);
	if (uniqueWords.size !== words.length) {
		throw new Error('Poople’s wordDist data contains duplicate words');
	}
	if (!uniqueWords.has('poop')) {
		throw new Error('Poople’s wordDist data does not contain POOP');
	}
	if (words.length < 2000 || words.length > 5000) {
		throw new Error(`Unexpected Poople dictionary size: ${words.length}`);
	}

	return words;
}

function extractStartWords(bundle) {
	const marker = 'startWords=`';
	const start = bundle.indexOf(marker);
	if (start === -1) {
		throw new Error('Could not find startWords in Poople’s JavaScript bundle');
	}

	const dataStart = start + marker.length;
	const dataEnd = bundle.indexOf('`', dataStart);
	if (dataEnd === -1) {
		throw new Error('Could not find the end of Poople’s startWords data');
	}

	const rows = bundle
		.slice(dataStart, dataEnd)
		.replaceAll('\\r', '')
		.split('\n')
		.filter(Boolean);

	const startWords = rows.map(row => {
		const [word, distance] = row.split(',');
		if (!/^[A-Z]{4}$/.test(word) || !/^\d+$/.test(distance)) {
			throw new Error(`Unexpected startWords row: ${row}`);
		}
		return word.toLowerCase();
	});

	if (startWords.length < 365) {
		throw new Error(`Unexpected Poople start-word schedule size: ${startWords.length}`);
	}
	return startWords;
}

const html = await fetchText(POOPLE_URL);
const bundleURL = extractBundleURL(html);
const bundle = await fetchText(bundleURL);
const words = extractWords(bundle);
const startWords = extractStartWords(bundle);

await fs.writeFile(outputPath, `${JSON.stringify(words, null, 2)}\n`);
await fs.writeFile(startWordsOutputPath, `${JSON.stringify({
	epoch: '2025-08-15T08:00:00.000Z',
	changeHourUTC: 8,
	words: startWords
}, null, 2)}\n`);
console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${words.length} accepted words`);
console.log(`Updated ${path.relative(process.cwd(), startWordsOutputPath)} with ${startWords.length} daily start words from ${bundleURL}`);
