const { tokenize } = require("./tokenizer");
const fs = require("fs");

let invertedIndex = {};

function addDocument(docId, text) {
  const tokens = tokenize(text);

  for (const token of tokens) {
    if (!invertedIndex[token]) {
      invertedIndex[token] = new Set();
    }

    invertedIndex[token].add(docId);
  }
}
function saveIndexToDisk(filePath) {
  const copyIndex = {};
  for (const [key, value] of Object.entries(invertedIndex)) {
    copyIndex[key] = Array.from(value);
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(copyIndex));
  } catch (error) {
    console.error("Failed to save index to disk:", error);
    throw error;
  }
}

function loadIndexFromDisk(filePath) {
  invertedIndex = {};
  try {
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(rawData)) {
      invertedIndex[key] = new Set(value);
    }
  } catch (error) {
    console.error("Failed to load index:", error);
    throw error;
  }
  return invertedIndex;
}
function search(query) {
  if (!query) return [];
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const sets = _collectTokenSets(tokens);
  if (sets.length === 0) return [];
  _sortBySize(sets);
  return _intersectSets(sets);
}

function _collectTokenSets(tokens) {
  const sets = [];
  for (const token of tokens) {
    const docSet = invertedIndex[token];
    if (!docSet) return [];
    sets.push(docSet);
  }
  return sets;
}

function _intersectSets(sets) {
  if (!sets || sets.length === 0) return [];
  if (sets.length === 1) return Array.from(sets[0]);
  const intersectArray = [];
  const mainSet = sets[0];
  for (const elem of mainSet) {
    let notFound = false;
    for (let i = 1; i < sets.length; i++) {
      if (!sets[i].has(elem)) {
        notFound = true;
        break;
      }
    }
    if (!notFound) {
      intersectArray.push(elem);
    }
  }
  return intersectArray;
}

function _sortBySize(sets) {
  sets.sort((a, b) => a.size - b.size);
}

module.exports = {
  invertedIndex,
  addDocument,
  search,
  saveIndexToDisk,
  loadIndexFromDisk,
};
