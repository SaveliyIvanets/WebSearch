import { Tokenizer } from "./Tokenizer.js";
import { Logger } from "../logger/Logger.js";
import fs from "fs";

const logger = new Logger({ prefix: "IndexStore" });

type InvertedIndex = Record<string, Set<string>>;

class IndexStore {
  private invertedIndex: InvertedIndex = {};

  addDocument(docId: string, text: string): void {
    const tokens = Tokenizer.tokenize(text);

    for (const token of tokens) {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = new Set();
      }

      this.invertedIndex[token].add(docId);
    }
  }

  getDocuments(token: string): Set<string> | null {
    return this.invertedIndex[token] ?? null;
  }

  saveIndexToDisk(filePath: string): void {
    const copyIndex: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(this.invertedIndex)) {
      copyIndex[key] = Array.from(value);
    }
    try {
      fs.writeFileSync(filePath, JSON.stringify(copyIndex));
    } catch (error) {
      logger.error("Failed to save index to disk", { error });
      throw error;
    }
  }

  loadIndexFromDisk(filePath: string): InvertedIndex {
    this.invertedIndex = {};
    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
        string,
        string[]
      >;
      for (const [key, value] of Object.entries(rawData)) {
        this.invertedIndex[key] = new Set(value);
      }
    } catch (error) {
      logger.error("Failed to load index", { error });
      throw error;
    }
    return this.invertedIndex;
  }
}
export { IndexStore };
