import { HTTPBody } from './HTTPBody';
import { EndpointEvent } from './EndpointEvent';

/**
 * Function interface for the logic that will check if a route
 * should be executed or not.
 */
export interface APIGatewayProxyEventCondition {
  (body: HTTPBody | undefined, event: EndpointEvent<any>): boolean;
}
