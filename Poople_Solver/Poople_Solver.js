const TARGET = 'poop';

let words = [];
let graph;
let distances;
let activeStart = '';
let version = '';
let hintStart = '';
let hintCurrent = '';
let hintTrail = [];
const rejected = new Set();

const form = document.querySelector('#solver-form');
const input = document.querySelector('#start-word');
const solveButton = document.querySelector('#solve-button');
const resetButton = document.querySelector('#reset-button');
const hintMode = document.querySelector('#hint-mode');
const status = document.querySelector('#status');
const solution = document.querySelector('#solution');
const solutionHeading = document.querySelector('#solution-heading');
const pathContainer = document.querySelector('#path');
const pathHelp = document.querySelector('.path-help');
const stepCount = document.querySelector('#step-count');
const hintsSection = document.querySelector('#hints-section');
const hintsContainer = document.querySelector('#hints');

function buildGraph(wordList) {
	const index = new Map(wordList.map((word, position) => [word, position]));
	const adjacency = wordList.map(() => []);
	const buckets = new Map();

	for (const word of wordList) {
		for (let position = 0; position < 4; position += 1) {
			const pattern = `${word.slice(0, position)}*${word.slice(position + 1)}`;
			const bucket = buckets.get(pattern) || [];
			bucket.push(word);
			buckets.set(pattern, bucket);
		}
	}

	for (const bucket of buckets.values()) {
		for (let first = 0; first < bucket.length; first += 1) {
			for (let second = first + 1; second < bucket.length; second += 1) {
				const firstIndex = index.get(bucket[first]);
				const secondIndex = index.get(bucket[second]);
				adjacency[firstIndex].push(secondIndex);
				adjacency[secondIndex].push(firstIndex);
			}
		}
	}

	return { index, adjacency };
}

function distancesToTarget() {
	const result = new Array(words.length).fill(-1);
	const targetIndex = graph.index.get(TARGET);
	const queue = [targetIndex];
	result[targetIndex] = 0;

	for (let head = 0; head < queue.length; head += 1) {
		const current = queue[head];
		for (const neighbour of graph.adjacency[current]) {
			if (result[neighbour] === -1 && !rejected.has(words[neighbour])) {
				result[neighbour] = result[current] + 1;
				queue.push(neighbour);
			}
		}
	}

	return result;
}

function shortestPath(start) {
	let current = graph.index.get(start);
	if (current === undefined || distances[current] === -1) {
		return null;
	}

	const path = [words[current]];
	while (distances[current] > 0) {
		current = graph.adjacency[current].find(neighbour => distances[neighbour] === distances[current] - 1);
		path.push(words[current]);
	}

	return path;
}

function rankedNextSteps(word) {
	const wordIndex = graph.index.get(word);
	if (wordIndex === undefined) {
		return [];
	}

	return graph.adjacency[wordIndex]
		.filter(neighbour => distances[neighbour] !== -1 && !rejected.has(words[neighbour]))
		.sort((first, second) => distances[first] - distances[second] || words[first].localeCompare(words[second]))
		.map(neighbour => ({
			word: words[neighbour],
			stepsRemaining: distances[neighbour]
		}));
}

function setStatus(message, isError = false) {
	status.textContent = message;
	status.classList.toggle('error', isError);
}

function makeWordButton(word, previousWord) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'word-button';
	button.setAttribute('aria-label', `Solve from ${word.toUpperCase()}`);

	for (let position = 0; position < word.length; position += 1) {
		const letter = document.createElement('span');
		letter.className = 'letter-box';
		letter.textContent = word[position];
		if (previousWord && word[position] !== previousWord[position]) {
			letter.classList.add('changed');
		}
		button.append(letter);
	}

	button.addEventListener('click', () => solve(word));
	return button;
}

function renderHints(word, path) {
	hintsSection.querySelector('.hint-start-over')?.remove();
	hintsSection.querySelector('h2').textContent = 'Other next moves';
	const pathNextWord = path[1];
	const alternatives = rankedNextSteps(word)
		.filter(option => option.word !== pathNextWord)
		.slice(0, 6);

	hintsContainer.replaceChildren();
	if (alternatives.length === 0 || word === TARGET) {
		hintsSection.hidden = true;
		return;
	}

	for (const option of alternatives) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'hint-button';
		button.innerHTML = `${option.word}<strong>${option.stepsRemaining} left</strong>`;
		button.addEventListener('click', () => solve(option.word));
		hintsContainer.append(button);
	}
	hintsSection.hidden = false;
}

function renderHintTrail() {
	pathContainer.replaceChildren();
	const trail = [...hintTrail, hintCurrent];

	trail.forEach((word, index) => {
		const row = document.createElement('div');
		row.className = 'path-row';
		const wordButton = makeWordButton(word, trail[index - 1]);
		wordButton.disabled = true;
		row.append(wordButton);
		pathContainer.append(row);
	});

	solutionHeading.textContent = 'Your path';
	pathHelp.textContent = 'Choose one of the ranked next words below to continue without revealing the full solution.';
	stepCount.textContent = `${hintTrail.length} ${hintTrail.length === 1 ? 'step' : 'steps'}`;
	solution.hidden = false;
}

function makeHintOption(option, currentDistance) {
	const button = document.createElement('button');
	const isBest = option.stepsRemaining === currentDistance - 1;
	button.type = 'button';
	button.className = `hint-button${isBest ? ' best' : ''}`;
	button.title = `${option.stepsRemaining} steps from POOP${isBest ? ' — makes progress' : ''}`;

	for (let position = 0; position < option.word.length; position += 1) {
		const letter = document.createElement('span');
		letter.textContent = option.word[position];
		if (option.word[position] !== hintCurrent[position]) {
			letter.className = 'changed-letter';
		}
		button.append(letter);
	}

	const distance = document.createElement('strong');
	distance.textContent = `${option.stepsRemaining} to go${isBest ? ' ✓' : ''}`;
	button.append(distance);
	button.addEventListener('click', () => {
		hintTrail.push(hintCurrent);
		hintCurrent = option.word;
		renderHintMode();
	});
	return button;
}

function renderHintMode() {
	renderHintTrail();
	hintsContainer.replaceChildren();
	hintsSection.querySelector('.hint-start-over')?.remove();
	hintsSection.hidden = false;

	if (hintCurrent === TARGET) {
		hintsSection.querySelector('h2').textContent = 'You made it!';
		setStatus(`Reached POOP in ${hintTrail.length} ${hintTrail.length === 1 ? 'step' : 'steps'}.`);
	} else {
		const currentIndex = graph.index.get(hintCurrent);
		const currentDistance = distances[currentIndex];
		const options = rankedNextSteps(hintCurrent).slice(0, 8);
		hintsSection.querySelector('h2').textContent = 'Choose your next word';
		setStatus(`Pick a next move from ${hintCurrent.toUpperCase()} toward POOP.`);

		for (const option of options) {
			hintsContainer.append(makeHintOption(option, currentDistance));
		}
	}

	const startOver = document.createElement('button');
	startOver.type = 'button';
	startOver.className = 'hint-start-over';
	startOver.textContent = 'Start over';
	startOver.addEventListener('click', () => {
		hintCurrent = hintStart;
		hintTrail = [];
		renderHintMode();
	});
	hintsSection.append(startOver);
}

function renderPath(path) {
	pathContainer.replaceChildren();
	solutionHeading.textContent = 'Shortest path';
	pathHelp.textContent = 'Tap a word to solve again from there. If Poople rejects a suggested word, exclude it and reroute.';

	path.forEach((word, index) => {
		const row = document.createElement('div');
		row.className = 'path-row';
		row.append(makeWordButton(word, path[index - 1]));

		if (index > 0 && index < path.length - 1) {
			const rejectButton = document.createElement('button');
			rejectButton.type = 'button';
			rejectButton.className = 'reject-button';
			rejectButton.textContent = '×';
			rejectButton.title = `Poople does not accept ${word.toUpperCase()}`;
			rejectButton.setAttribute('aria-label', `Exclude ${word.toUpperCase()} and find another route`);
			rejectButton.addEventListener('click', () => {
				rejected.add(word);
				distances = distancesToTarget();
				solve(activeStart, `${word.toUpperCase()} excluded. Found a new route.`);
			});
			row.append(rejectButton);
		}

		pathContainer.append(row);
	});

	stepCount.textContent = `${path.length - 1} ${path.length === 2 ? 'step' : 'steps'}`;
	solution.hidden = false;
	renderHints(path[0], path);
}

function solve(requestedWord, successMessage = '') {
	if (!graph) {
		return;
	}

	const start = requestedWord.trim().toLowerCase();
	input.value = start.toUpperCase();

	if (!/^[a-z]{4}$/.test(start)) {
		setStatus('Enter a four-letter word.', true);
		solution.hidden = true;
		hintsSection.hidden = true;
		return;
	}

	if (!graph.index.has(start)) {
		setStatus(`${start.toUpperCase()} is not in this solver’s dictionary.`, true);
		solution.hidden = true;
		hintsSection.hidden = true;
		return;
	}

	const path = shortestPath(start);
	if (!path) {
		setStatus(`No route from ${start.toUpperCase()} to POOP was found with the current exclusions.`, true);
		solution.hidden = true;
		hintsSection.hidden = true;
		return;
	}

	activeStart = start;
	if (hintMode.checked) {
		hintStart = start;
		hintCurrent = start;
		hintTrail = [];
		renderHintMode();
		return;
	}
	setStatus(successMessage || `A shortest route from ${start.toUpperCase()} to POOP.`);
	renderPath(path);
}

function reset() {
	rejected.clear();
	distances = distancesToTarget();
	activeStart = '';
	input.value = '';
	solution.hidden = true;
	hintsSection.hidden = true;
	setStatus('Ready for a four-letter starting word.');
	input.focus();
}

form.addEventListener('submit', event => {
	event.preventDefault();
	solve(input.value);
});

input.addEventListener('input', () => {
	input.value = input.value.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase();
});

resetButton.addEventListener('click', reset);
hintMode.addEventListener('change', () => {
	if (input.value.length === 4) {
		solve(input.value);
	}
});

async function getVersion() {
	const versionURL = `/Poople_Solver/version.json?v=${encodeURIComponent(version || '2.1.1-BETA')}`;
	const request = new Request(versionURL, { cache: 'no-store' });
	const response = await fetch(request);
	if (!response.ok) {
		throw new Error(`Version request failed (${response.status})`);
	}
	const versionData = await response.json();
	version = `${versionData.buildMajor}.${versionData.buildMinor}.${versionData.buildRevision}-${versionData.buildTag}`;
	document.querySelector('#version').textContent = `v${version}`;
}

function getGameDay(epoch) {
	return Math.ceil((Date.now() - Date.parse(epoch)) / 86_400_000);
}

async function getLiveTodaysStartWord(gameDay) {
	const homepageResponse = await fetch('https://poople.io/', { cache: 'no-store' });
	if (!homepageResponse.ok) {
		throw new Error(`Live Poople homepage request failed (${homepageResponse.status})`);
	}

	const homepage = await homepageResponse.text();
	const scripts = [...homepage.matchAll(/<script[^>]+src="([^"]+\.js)"[^>]*>/gi)];
	const bundleScript = scripts.find(([, source]) => source.includes('/assets/index-'));
	if (!bundleScript) {
		throw new Error('Could not find Poople’s live game bundle');
	}

	const bundleURL = new URL(bundleScript[1], 'https://poople.io/');
	const bundleResponse = await fetch(bundleURL, { cache: 'no-store' });
	if (!bundleResponse.ok) {
		throw new Error(`Live Poople bundle request failed (${bundleResponse.status})`);
	}

	const bundle = await bundleResponse.text();
	const marker = 'startWords=`';
	const dataStart = bundle.indexOf(marker);
	const dataEnd = dataStart === -1 ? -1 : bundle.indexOf('`', dataStart + marker.length);
	if (dataStart === -1 || dataEnd === -1) {
		throw new Error('Could not find Poople’s live start-word schedule');
	}

	const liveStartWords = bundle
		.slice(dataStart + marker.length, dataEnd)
		.replaceAll('\\r', '')
		.split('\n')
		.filter(Boolean)
		.map(row => row.split(',')[0].toLowerCase());

	const todaysStartWord = liveStartWords[gameDay];
	if (!/^[a-z]{4}$/.test(todaysStartWord || '')) {
		throw new Error(`Poople’s live schedule has no word for game day ${gameDay}`);
	}
	return todaysStartWord;
}

async function initialise() {
	try {
		const [wordsResponse, startWordsResponse] = await Promise.all([
			fetch('./words.json'),
			fetch('./start-words.json')
		]);
		if (!wordsResponse.ok) {
			throw new Error(`Dictionary request failed (${wordsResponse.status})`);
		}
		if (!startWordsResponse.ok) {
			throw new Error(`Start-word request failed (${startWordsResponse.status})`);
		}
		words = await wordsResponse.json();
		const startWords = await startWordsResponse.json();
		graph = buildGraph(words);
		distances = distancesToTarget();
		const gameDay = getGameDay(startWords.epoch);
		const todaysStartWord = startWords.words[gameDay];
		if (todaysStartWord) {
			input.value = todaysStartWord.toUpperCase();
		}
		solveButton.disabled = false;
		setStatus(todaysStartWord
			? `Today’s Poople starting word is ${todaysStartWord.toUpperCase()}.`
			: 'Ready for a four-letter starting word.');
		input.focus();

		getLiveTodaysStartWord(gameDay).then(liveStartWord => {
			const localStartWord = todaysStartWord?.toUpperCase() || '';
			const liveWord = liveStartWord.toUpperCase();
			const fieldStillAutomatic = input.value === localStartWord || input.value === '';
			if (fieldStillAutomatic && localStartWord && liveWord !== localStartWord) {
				const useLiveWord = window.confirm(
					`Poople’s live starting word is ${liveWord}, but the local schedule says ${localStartWord}.\n\nUse the live word?`
				);
				if (useLiveWord) {
					input.value = liveWord;
					setStatus(`Using Poople’s live starting word: ${liveWord}.`);
				} else {
					setStatus(`Keeping the local starting word: ${localStartWord}.`, true);
				}
			} else if (fieldStillAutomatic) {
				input.value = liveWord;
				setStatus(`Today’s Poople starting word is ${liveWord}.`);
			}
		}).catch(error => {
			console.warn('Could not check today’s live Poople starting word:', error);
		});
	} catch (error) {
		console.error(error);
		setStatus('The word list could not be loaded. Please refresh and try again.', true);
	}
}

solveButton.disabled = true;
getVersion().catch(error => console.warn('Could not load version:', error));
initialise();
