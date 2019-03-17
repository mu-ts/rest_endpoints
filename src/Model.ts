export { Handler, Context, Callback } from 'aws-lambda';

/**
 * The details returned from an authorizer.
 */
export interface HTTPAuthorizer {
  principalId: string | null;
  apiKey: string | null;
  sourceIp: string | null;
  userAgent: string | null;
}

/**
 * Request context within the EndpointEvent.
 */
export interface HTTPRequestContext {
  accountId: string;
  resourceId: string;
  requestId: string;
  authorizer: HTTPAuthorizer;
}

/**
 * Models the incomming request as formatted by the default serverless framework
 * template.
 */
export interface HTTPEvent {
  body: string | null;
  httpMethod: string;
  path: string;
  resource: string;
  stage: string;
  headers: any;
  queryStringParameters: any;
  pathParameters: any;
  requestContext: HTTPRequestContext;
}

/**
 * An HTTP body.
 */
export interface HTTPBody {
  [key: string]: any;
}

/**
 * HTTP Headers.
 */
export interface HTTPHeaders {
  [key: string]: string;
}

/**
 * Structures the response so that API Gateway can interpret it.
 */
export class HTTPResponse {

  //TODO rewrite into a builder pattern.

  private body: string;
  private statusCode: number = 200;
  private headers: HTTPHeaders | undefined;

  private static _defaultHeaders: HTTPHeaders | {};

  constructor(body?: string | HTTPBody, statusCode?: number) {
    this.statusCode = statusCode || 200;
    this.body = typeof body === 'string' ? body : JSON.stringify(body);
    this.headers = {};
  }

  /**
   * Ideally you should declare defaults for:
   * - Server
   * - X-Powered-By
   * - Set-Cookie
   * - X-Frame-Options
   * - Content-Type
   * - Cache-Control
   * 
   * @param defaultHeaders To set when a new HTTPResponse is created
   */
  public static setDefaultHeaders(defaultHeaders: HTTPHeaders): void {
    HTTPResponse._defaultHeaders = defaultHeaders || {};
  }

  /**
   * 
   * @param body To return to the caller.
   */
  public setBody(body: string | HTTPBody): HTTPResponse {
    this.body = typeof body === 'string' ? body : JSON.stringify(body);
    return this;
  }

  /**
   * 
   * @param statusCode to return the response under, https://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
   */
  public setStatusCode(statusCode: number): HTTPResponse {
    this.statusCode = statusCode;
    return this;
  }

  /**
   * Add a single new header to the response.
   * 
   * @param name of the header to add.
   * @param value of the header to add.
   */
  public addHeader(name: string, value: string): HTTPResponse {
    if (!this.headers) this.headers = HTTPResponse._defaultHeaders;
    this.headers[name] = value;
    return this;
  }

  /**
   * Add a multiple new header to the response.
   * 
   * @param headers to add.
   */
  public addHeaders(headers: HTTPHeaders): HTTPResponse {
    if (!this.headers) this.headers = headers;
    else {
      Object
        .keys(headers)
        .forEach((key: string) => this.addHeader(key, headers[key]));
    }
    return this;
  }
}