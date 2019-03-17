export { Handler, Context, Callback } from 'aws-lambda';


//TODO model request https://serverless.com/framework/docs/providers/aws/events/apigateway/

export interface EndpointEventAuthorizer {
  principalId:string | null;
  apiKey:string | null;
  sourceIp:string | null;
  userAgent:string | null;
}

/**
 * Request context within the EndpointEvent.
 */
export interface EndpointEventRequestContext {
  accountId:string;
  resourceId:string;
  requestId:string;
  authorizer:EndpointEventAuthorizer;
}

/**
 * Models the incomming request as formatted by the default serverless framework
 * template.
 */
export interface EndpointEvent {
  body:string | null;
  httpMethod:string;
  path:string;
  resource:string;
  stage:string;
  headers:any;
  queryStringParameters:any;
  pathParameters:any;
  requestContext:EndpointEventRequestContext;
}

/**
 * Structures the response so that API Gateway can interpret it.
 */
export class EndpointResponse {
  
  public body:string;
  public statusCode:number;
  public headers:{};

  constructor(statusCode:number, body?:string | any, headers?:any){
    this.statusCode = statusCode;
    this.body       = typeof body === 'string' ? body : JSON.stringify(body);
    this.headers    = Object.assign({
      //FIXME DRY
      'Server': 'AuthVia',
      'Set-Cookie': 'Secure',
      // 'X-Frame-Options': 'DENY', Should be deteremined from JWT.
      'X-Powered-By': 'AuthVia',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }, headers);
  }

  public setCORS(origin:string, actions:string, credentials:boolean = true, headers?:string){
    this.headers['Access-Control-Allow-Origin']      = origin; 
    this.headers['Access-Control-Allow-Methods']     = actions;
    this.headers['Access-Control-Allow-Credentials'] = credentials ? 'true' : 'false';
    if(headers) this.headers['Access-Control-Allow-Headers'] = headers;
  }
}
