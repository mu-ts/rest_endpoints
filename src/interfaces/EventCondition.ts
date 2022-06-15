import { EndpointEvent, HTTPBody } from '../model';

export interface EventCondition {
  (body: HTTPBody | undefined, event: EndpointEvent<any>): boolean;
}
