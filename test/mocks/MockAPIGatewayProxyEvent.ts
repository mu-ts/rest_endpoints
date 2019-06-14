import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from 'aws-lambda';
import { MockAPIGatewayEventRequestContext } from './MockAPIGatewayEventRequestContext';

class MockAPIGatewayProxyEvent implements APIGatewayProxyEvent {
  body: string | null = null;
  headers: { [p: string]: string } = {};
  httpMethod: string = '';
  isBase64Encoded: boolean = false;
  multiValueHeaders: { [p: string]: string[] } = {};
  multiValueQueryStringParameters: { [p: string]: string[] } | null = {};
  path: string = '';
  pathParameters: { [p: string]: string } | null = {};
  queryStringParameters: { [p: string]: string } | null = {};
  requestContext: APIGatewayEventRequestContext = new MockAPIGatewayEventRequestContext();
  resource: string = '';
  stageVariables: { [p: string]: string } | null = {};
}

export { MockAPIGatewayProxyEvent };
