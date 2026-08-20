import { describe, it, expect } from "vitest";
import { Tokenizer } from "../../../src/indexer/Tokenizer.js";

describe("Tokenizer", () => {
  it("should tokenize text into unique words and filter stop words", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const tokens = Tokenizer.tokenize(text);

    expect(tokens).not.toContain("the");
    expect(tokens).toEqual(
      expect.arrayContaining([
        "quick",
        "brown",
        "fox",
        "jumps",
        "over",
        "lazy",
        "dog",
      ]),
    );
  });

  it("should return empty array for empty inputs", () => {
    expect(Tokenizer.tokenize("")).toEqual([]);
  });
});
