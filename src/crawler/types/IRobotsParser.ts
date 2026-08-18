interface IRobotsParser {
    load(origin: string): Promise<void>;
    getCrawlDelay(): number | null;
    canVisit(url: string): boolean;
  }
  
  export { IRobotsParser };