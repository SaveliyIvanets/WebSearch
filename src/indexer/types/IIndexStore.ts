interface IIndexStore {
  addDocument(docId: string, text: string): void;
  getDocuments(token: string): Set<string> | null;
}

export { IIndexStore };
