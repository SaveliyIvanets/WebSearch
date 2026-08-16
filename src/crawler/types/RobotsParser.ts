interface RobotsParser {
    load(origin: string): Promise<void>;
    getCrawlDelay(): number | null;
    canVisit(url: string): boolean;
  }
  
  export { RobotsParser };