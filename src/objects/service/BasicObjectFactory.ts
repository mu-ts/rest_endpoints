import { Constructable } from '../model/Constructable';
import { ObjectFactory } from '../model/ObjectFactory';

export class BasicObjectFactory implements ObjectFactory {
  private readonly instances: Record<string, unknown>;

  constructor() {
    this.instances = {};
  }

  /**
   * Basic 'new' on a constructable class.
   *
   * @param constructable item.
   * @returns
   */
  public resolve<T>(constructable: Constructable<T>): T {
    // eslint-disable-next-line new-cap
    if (!this.instances[constructable.name]) this.instances[constructable.name] = new constructable();
    return this.instances[constructable.name] as T;
  }
}
