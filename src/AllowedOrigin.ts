import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { EndpointEvent } from './EndpointEvent';

export interface AllowedOrigin {
  (event: EndpointEvent<any>, response: HTTPAPIGatewayProxyResult): string;
}
