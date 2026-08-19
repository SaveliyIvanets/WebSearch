interface Node<T> {
  elem: T;
  next: Node<T> | null;
}
class Queue<T> {
  private _size: number = 0;
  private _head: Node<T> | null = null;
  private _tail: Node<T> | null = null;
  push(elem: T): void {
    const node: Node<T> = {
      elem,
      next: null,
    };
    if (this._size === 0) {
      this._head = node;
      this._tail = node;
    } else {
      this._tail!.next = node;
      this._tail = node;
    }
    this._size++;
  }
  pop(): T | null {
    if (this._size === 0) {
      return null;
    }
    const popped = this._head!;
    this._head = popped.next;
    this._size--;
    if (this._size === 0) {
      this._tail = null;
    }
    return popped.elem;
  }
  isEmpty(): boolean {
    return this._size === 0;
  }
  get size(): number {
    return this._size;
  }
}
export { Queue };
