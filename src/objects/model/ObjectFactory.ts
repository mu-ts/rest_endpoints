import { Constructable } from "./Constructable";

export interface ObjectFactory {
  instantiate<T>(constructable: Constructable<T>): T;
}