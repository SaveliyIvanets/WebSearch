interface PageFetcher {
    fetchText(url: string): Promise<string | null>;
}
  
export { PageFetcher };