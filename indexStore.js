const { tokenize } = require("./tokenizer");

const invertedIndex = {};

function addDocument(docId, text) {
  const tokens = tokenize(text);

  for (const token of tokens) {
    if (!invertedIndex[token]) {
      invertedIndex[token] = new Set();
    }

    invertedIndex[token].add(docId);
  }
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
  let notFound = false;
  for (const elem of mainSet) {
    for (let i = 1; i < sets.length; i++) {
      if (!sets[i].has(elem)) {
        notFound = true;
        break;
      }
    }
    if (!notFound) {
      intersectArray.push(elem);
    }
    notFound = false;
  }
  return intersectArray;
}

function _sortBySize(sets) {
  sets.sort((a, b) => a.size - b.size);
}

module.exports = { invertedIndex, addDocument, search };
