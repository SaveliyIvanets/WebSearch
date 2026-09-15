export interface Strategy<T> {
    apply(input: T): T;
}