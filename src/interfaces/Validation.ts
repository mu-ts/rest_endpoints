import { EventCondition } from './EventCondition';

export interface Validation {
  descriptor: PropertyDescriptor;
  schema: object;
  validatorCondition?: EventCondition;
}
