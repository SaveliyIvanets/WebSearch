import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IndexStore } from "../../../src/indexer/IndexStore.js";
import fs from "fs";
import path from "path";

describe("IndexStore", () => {
  const tempFilePath = path.join(__dirname, "temp_index.json");

  afterEach(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it("should store and retrieve document references by token", () => {
    const store = new IndexStore();
    store.addDocument("doc1", "hello world");
    store.addDocument("doc2", "hello universe");

    const helloDocs = store.getDocuments("hello");
    const worldDocs = store.getDocuments("world");

    expect(helloDocs).toEqual(new Set(["doc1", "doc2"]));
    expect(worldDocs).toEqual(new Set(["doc1"]));
  });

  it("should correctly persist and reload index from disk", () => {
    const store = new IndexStore();
    store.addDocument("doc1", "javascript typescript");
    store.saveIndexToDisk(tempFilePath);

    const reloadedStore = new IndexStore();
    reloadedStore.loadIndexFromDisk(tempFilePath);

    expect(reloadedStore.getDocuments("javascript")).toEqual(new Set(["doc1"]));
  });
});
