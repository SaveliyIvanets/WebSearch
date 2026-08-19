import { Tokenizer } from "../indexer/Tokenizer.js";
import { IIndexStore } from "../indexer/types/IIndexStore.js";
import { Logger } from "../logger/Logger.js";

const logger = new Logger({prefix: "SearchEngine"});

class SearchEngine {
  private indexStore: IIndexStore;

  constructor(indexStore: IIndexStore) {
    this.indexStore = indexStore;
  }

  search(query: string): string[] {
    logger.debug("Searching for query", { query }); 

    if (typeof query !== "string" || query.trim() === "") {
      logger.debug("Empty or invalid query provided", { query });
      return [];
    }

    const tokens = Tokenizer.tokenize(query);
    if (tokens.length === 0) {
      logger.debug("No valid tokens found in query", { query });
      return [];
    }
    const sets = this._sortBySize(this._getPostingLists(tokens));
    if (sets.length === 0) {
      logger.debug("No results found for query", { query });
      return [];
    }

    const result = this._intersectSets(sets);
    logger.debug("Search completed", { query, result });
    return result;
  }

  private _getPostingLists(tokens: string[]): Set<string>[] {
    const sets: Set<string>[] = [];
    for (const token of tokens) {
      const docSet = this.indexStore.getDocuments(token);
      if (!docSet) {
        logger.debug("No documents found for token", { token });
        return [];
      }
      sets.push(docSet);
    }
    return sets;
  }

  private _intersectSets(sets: Set<string>[]): string[] {
    if (!sets || sets.length === 0) return [];
    if (sets.length === 1) return Array.from(sets[0]);
    const intersectArray: string[] = [];
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

  private _sortBySize(sets: Set<string>[]): Set<string>[] {
    return sets.sort((a, b) => a.size - b.size);
  }
}
export { SearchEngine };
