import { HTTPBody } from './model/HTTPBody';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Structures the response so that API Gateway can interpret it.
 */
export class HTTPAPIGatewayProxyResult implements APIGatewayProxyResult {
  public body: string | any = '';
  public type?: any = undefined;
  public statusCode: number = 200;
  public headers?: {
    [header: string]: boolean | number | string;
  };
  public multiValueHeaders?: {
    [header: string]: Array<boolean | number | string>;
  };
  public isBase64Encoded?: boolean;

  private static _defaultHeaders: { [name: string]: boolean | number | string } = {};

  private constructor() {}

  /**
   * Ideally you should declare defaults for:
   * - Server
   * - X-Powered-By
   * - Set-Cookie
   * - X-Frame-Options
   * - Content-Type
   * - Cache-Control
   *
   * @param defaultHeaders To set when a new HTTPAPIGatewayProxyResult is created
   */
  public static setDefaultHeaders(defaultHeaders: { [name: string]: boolean | number | string }): void {
    this._defaultHeaders = Object.assign(defaultHeaders) || {};
  }

  /**
   *
   * @param body
   */
  public static setBody<T>(body: string | HTTPBody, type?: T): HTTPAPIGatewayProxyResult {
    const response: HTTPAPIGatewayProxyResult = new HTTPAPIGatewayProxyResult();
    response.setBody(body, type);
    return response;
  }

  /**
   *
   * @param body To return to the caller.
   */
  public setBody<T>(body: string | HTTPBody, type?: T): HTTPAPIGatewayProxyResult {
    this.body = body;
    this.type = type;
    return this;
  }

  /**
   * @param statusCode to return the response under, https://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
   */
  public static setStatusCode(statusCode: number): HTTPAPIGatewayProxyResult {
    const response: HTTPAPIGatewayProxyResult = new HTTPAPIGatewayProxyResult();
    response.setStatusCode(statusCode);
    return response;
  }

  /**
   *
   * @param statusCode to return the response under, https://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
   */
  public setStatusCode(statusCode: number): HTTPAPIGatewayProxyResult {
    this.statusCode = statusCode;
    return this;
  }

  /**
   * Returns the current status code.
   */
  public getStatusCode(): number {
    return this.statusCode;
  }

  /**
   * Add a single new header to the response.
   *
   * @param name of the header to add.
   * @param value of the header to add.
   */
  public addHeader(name: string, value: boolean | number | string): HTTPAPIGatewayProxyResult {
    if (!this.headers) this.headers = Object.assign(HTTPAPIGatewayProxyResult._defaultHeaders) || {};
    this.headers[name] = value;
    return this;
  }

  /**
   * Add a multiple new header to the response.
   *
   * @param headers to add.
   */
  public addHeaders(headers: { [name: string]: boolean | number | string }): HTTPAPIGatewayProxyResult {
    if (!this.headers) this.headers = Object.assign(headers);
    else {
      Object.keys(headers).forEach((key: string) => this.addHeader(key, headers[key]));
    }
    return this;
  }
}
