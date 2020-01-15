import { APIGatewayProxyEvent } from 'aws-lambda';
import { HTTPAPIGatewayProxyResult } from '../HTTPAPIGatewayProxyResult';

export interface AllowedOrigin {
  (event: APIGatewayProxyEvent, response: HTTPAPIGatewayProxyResult): string;
}
