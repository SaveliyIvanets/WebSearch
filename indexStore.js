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
  const documentArray = _getDocumentsIdByTokens(tokens);
  const documentsWithAllQueryTokens = _setsIntersect(documentArray);
  return documentsWithAllQueryTokens;
}

function _getDocumentsIdByTokens(tokens) {
  if (tokens.length === 1) {
    return invertedIndex[tokens] ? invertedIndex[tokens] : [];
  }
  const documentArray = [];
  for (const token of tokens) {
    if (!invertedIndex[token]) return [];
    documentArray.push(invertedIndex[token]);
  }
  return documentArray;
}

function _setsIntersect(sets) {
  if (!sets || sets.length === 0) return [];
  if (sets.length === 1) return sets;
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

module.exports = { invertedIndex, addDocument, search };
