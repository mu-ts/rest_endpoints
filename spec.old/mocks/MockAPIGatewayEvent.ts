import { APIGatewayEvent, APIGatewayEventRequestContext } from 'aws-lambda';
import { MockAPIGatewayEventRequestContext } from './MockAPIGatewayEventRequestContext';

class MockAPIGatewayEvent implements APIGatewayEvent {
  body: string | null;
  headers: { [p: string]: string };
  httpMethod: string;
  isBase64Encoded: boolean;
  multiValueHeaders: { [p: string]: string[] };
  multiValueQueryStringParameters: { [p: string]: string[] } | null;
  path: string;
  pathParameters: { [p: string]: string } | null;
  queryStringParameters: { [p: string]: string } | null;
  requestContext: APIGatewayEventRequestContext = new MockAPIGatewayEventRequestContext();
  resource: string;
  stageVariables: { [p: string]: string } | null;

  setBody(body: any): MockAPIGatewayEvent {
    if (typeof body === 'string') {
      this.body = body;
    } else {
      this.body = JSON.stringify(body);
    }
    return this;
  }
}

export { MockAPIGatewayEvent };