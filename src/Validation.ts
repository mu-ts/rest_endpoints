import { EventCondition } from './EventCondition';

export interface Validation {
  schema: object;
  validatorCondition?: EventCondition;
}
