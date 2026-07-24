const TARGET = 'poop';

let words = [];
let graph;
let distances;
let activeStart = '';
const rejected = new Set();

const form = document.querySelector('#solver-form');
const input = document.querySelector('#start-word');
const solveButton = document.querySelector('#solve-button');
const resetButton = document.querySelector('#reset-button');
const status = document.querySelector('#status');
const solution = document.querySelector('#solution');
const pathContainer = document.querySelector('#path');
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

function renderPath(path) {
	pathContainer.replaceChildren();

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

async function initialise() {
	try {
		const response = await fetch('./words.json');
		if (!response.ok) {
			throw new Error(`Dictionary request failed (${response.status})`);
		}
		words = await response.json();
		graph = buildGraph(words);
		distances = distancesToTarget();
		solveButton.disabled = false;
		setStatus('Ready for a four-letter starting word.');
		input.focus();
	} catch (error) {
		console.error(error);
		setStatus('The word list could not be loaded. Please refresh and try again.', true);
	}
}

solveButton.disabled = true;
initialise();
