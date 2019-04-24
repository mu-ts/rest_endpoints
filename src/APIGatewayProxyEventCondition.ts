import { HTTPBody } from './HTTPBody';
import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Function interface for the logic that will check if a route
 * should be executed or not.
 */
export interface APIGatewayProxyEventCondition {
  (body: HTTPBody | undefined, event: APIGatewayProxyEvent): boolean;
}
