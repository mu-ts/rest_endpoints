import { Constructable } from "../model/Constructable";
import { ObjectFactory } from "../model/ObjectFactory";

export class BasicObjectFactory implements ObjectFactory {
  /**
   * Basic 'new' on a constructable class.
   * 
   * @param constructable item.
   * @returns 
   */
  public instantiate<T>(constructable: Constructable<T>): T {
    return new constructable;
  }
}