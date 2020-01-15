import { APIGatewayEventRequestContext } from 'aws-lambda';
import { StringMap } from './StringMap';

export interface EndpointEvent<T extends any> {
  body: T | null;
  rawBody: string | null;
  headers: StringMap;
  multiValueHeaders: { [name: string]: string[] };
  httpMethod: string;
  isBase64Encoded: boolean;
  path: string;
  pathParameters: StringMap;
  queryStringParameters: StringMap;
  multiValueQueryStringParameters: { [name: string]: string[] } | null;
  stageVariables: StringMap;
  requestContext: APIGatewayEventRequestContext;
  resource: string;
}
