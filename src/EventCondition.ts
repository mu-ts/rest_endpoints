import { HTTPBody } from './HTTPBody';
import { EndpointEvent } from './EndpointEvent';

export interface EventCondition {
  (body: HTTPBody | undefined, event: EndpointEvent<any>): boolean;
}
