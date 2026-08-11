import { Logger } from "../logger/Logger.js";
const logger = new Logger({prefix: "Tokenizer"});

class Tokenizer {
  static STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "in",
    "on",
    "at",
    "of",
    "to",
    "for",
    "with",
    "by",
  ]);
  static tokenize(text: string): string[] {
    if (typeof text !== "string" || text.length === 0) return [];
    const tokens = text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 0 && !this.STOP_WORDS.has(word));

    return Array.from(new Set(tokens));
  }
}
export { Tokenizer };
