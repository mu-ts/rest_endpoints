import { APIGatewayProxyEvent } from 'aws-lambda';
import { HTTPBody } from './HTTPBody';

export interface EventCondition {
  (body: HTTPBody | undefined, event: APIGatewayProxyEvent): boolean;
}
