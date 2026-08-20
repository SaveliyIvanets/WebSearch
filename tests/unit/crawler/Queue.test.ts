import { describe, it, expect } from "vitest";
import { Queue } from "../../../src/crawler/Queue.js";

describe("Queue", () => {
  it("should push and pop elements in FIFO order", () => {
    const queue = new Queue<number>();
    queue.push(1);
    queue.push(2);

    expect(queue.size).toBe(2);
    expect(queue.pop()).toBe(1);
    expect(queue.pop()).toBe(2);
    expect(queue.isEmpty()).toBe(true);
  });

  it("should return null when popping from an empty queue", () => {
    const queue = new Queue<string>();
    expect(queue.pop()).toBeNull();
    expect(queue.isEmpty()).toBe(true);
  });
});
