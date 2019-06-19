import { APIGatewayEventRequestContext } from 'aws-lambda';

export class StringMap {
  private values: { [name: string]: string | undefined };

  constructor(values: { [name: string]: string | undefined } | null) {
    this.values = values || {};
  }

  /**
   *
   * @param key of the value to return.
   */
  public get(key: string): string | undefined {
    return this.values[key];
  }

  /**
   *
   * @param name of the value to return.
   */
  public getAsBoolean(key: string): boolean {
    const value: string | undefined = this.get(key);
    if (!value) return false;
    return value.toLowerCase() === 'true';
  }

  /**
   *
   * @param name of the value to return.
   */
  public getAsNumber(key: string): number {
    const value: string | undefined = this.get(key);
    return Number(value);
  }
}

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
