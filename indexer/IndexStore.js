const { Tokenizer } = require("./Tokenizer");
const fs = require("fs");
class IndexStore {
  constructor() {
    this.invertedIndex = {};
  }

  addDocument(docId, text) {
    const tokens = Tokenizer.tokenize(text);

    for (const token of tokens) {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = new Set();
      }

      this.invertedIndex[token].add(docId);
    }
  }
  getDocuments(token) {
    return this.invertedIndex[token] ?? null;
  }
  saveIndexToDisk(filePath) {
    const copyIndex = {};
    for (const [key, value] of Object.entries(this.invertedIndex)) {
      copyIndex[key] = Array.from(value);
    }
    try {
      fs.writeFileSync(filePath, JSON.stringify(copyIndex));
    } catch (error) {
      console.error("Failed to save index to disk:", error);
      throw error;
    }
  }

  loadIndexFromDisk(filePath) {
    this.invertedIndex = {};
    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      for (const [key, value] of Object.entries(rawData)) {
        this.invertedIndex[key] = new Set(value);
      }
    } catch (error) {
      console.error("Failed to load index:", error);
      throw error;
    }
    return this.invertedIndex;
  }
}
module.exports = { IndexStore };
