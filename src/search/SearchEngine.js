import { Tokenizer } from "../indexer/Tokenizer.js";
class SearchEngine {
  constructor(indexStore) {
    this.indexStore = indexStore;
  }
  search(query) {
    if (typeof query !== "string" || query.trim() === "") {
      return [];
    }
    const tokens = Tokenizer.tokenize(query);
    if (tokens.length === 0) return [];
    const sets = this._sortBySize(this._getPostingLists(tokens));
    if (sets.length === 0) return [];
    return this._intersectSets(sets);
  }

  _getPostingLists(tokens) {
    const sets = [];
    for (const token of tokens) {
      const docSet = this.indexStore.getDocuments(token);
      if (!docSet) return [];
      sets.push(docSet);
    }
    return sets;
  }

  _intersectSets(sets) {
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

  _sortBySize(sets) {
    return sets.sort((a, b) => a.size - b.size);
  }
}
export { SearchEngine };
