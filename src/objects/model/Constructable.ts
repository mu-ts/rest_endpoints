export interface Constructable<T> {
  name: string;
  new(): T;
}
