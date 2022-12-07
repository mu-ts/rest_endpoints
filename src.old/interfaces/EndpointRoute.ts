import { EventCondition } from './EventCondition';
import { Validation } from './Validation';

export interface EndpointRoute {
  resource?: string;
  action: string;
  endpoint: Function;
  condition?: EventCondition;
  priority: number;
  validations?: Array<Validation>;
  descriptor: PropertyDescriptor;
}
