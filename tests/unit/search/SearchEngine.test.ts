import { describe, it, expect, beforeEach } from "vitest";
import { SearchEngine } from "../../../src/search/SearchEngine.js";
import { IndexStore } from "../../../src/indexer/IndexStore.js";

describe("SearchEngine", () => {
  let store: IndexStore;
  let engine: SearchEngine;

  beforeEach(() => {
    store = new IndexStore();
    store.addDocument("https://site.com/1", "fast nodejs search engine");
    store.addDocument("https://site.com/2", "fast python crawler");
    store.addDocument("https://site.com/3", "nodejs backend development");
    engine = new SearchEngine(store);
  });

  it("should perform intersection search for multiple query tokens", () => {
    const results = engine.search("fast nodejs");
    expect(results).toEqual(["https://site.com/1"]);
  });

  it("should return empty array when query tokens match no document", () => {
    expect(engine.search("nonexistent query")).toEqual([]);
  });

  it("should return empty array for empty string or stop words", () => {
    expect(engine.search("   ")).toEqual([]);
    expect(engine.search("the in on")).toEqual([]);
  });
});
