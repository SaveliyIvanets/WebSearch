class Queue {
  constructor() {
    this._size = 0;
    this._head = null;
    this._tail = null;
  }
  push(elem) {
    const node = {
      elem,
      next: null,
    };
    if (this._size === 0) {
      this._head = node;
      this._tail = node;
    } else {
      this._tail.next = node;
      this._tail = node;
    }
    this._size++;
  }
  pop() {
    if (this._size === 0) {
      return null;
    }
    const popped = this._head;
    this._head = this._head.next;
    this._size--;
    if (this._size === 0) {
      this._tail = null;
    }
    return popped.elem;
  }
  isEmpty() {
    return this._size === 0;
  }
  get size() {
    return this._size;
  }
}
module.exports = { Queue };
