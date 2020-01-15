import { HTTPBody } from '../model/HTTPBody';
import { EndpointEvent } from '../model/EndpointEvent';

export interface EventCondition {
  (body: HTTPBody | undefined, event: EndpointEvent<any>): boolean;
}
