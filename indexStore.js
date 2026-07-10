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
module.exports = { invertedIndex, addDocument };
