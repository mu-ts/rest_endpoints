import { Constructable } from './Constructable';

export interface ObjectFactory {
  resolve<T>(constructable: Constructable<T>): T;
}
