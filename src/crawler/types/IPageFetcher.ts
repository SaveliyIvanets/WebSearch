interface IPageFetcher {
    fetchText(url: string): Promise<string | null>;
}
  
export { IPageFetcher };