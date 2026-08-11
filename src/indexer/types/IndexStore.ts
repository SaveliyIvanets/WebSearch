interface IndexStore {
  addDocument(docId: string, text: string): void;
  getDocuments(token: string): Set<string> | null;
}

export { IndexStore };
