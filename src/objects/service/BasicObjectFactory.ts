import { Constructable } from "objects/model/Constructable";
import { ObjectFactory } from "objects/model/ObjectFactory";

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