interface Queue<T> {
  push(elem: T): void;
  pop(): T | null;
  isEmpty(): boolean;
}

export { Queue };
