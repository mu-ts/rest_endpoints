import { HTTPAPIGatewayProxyResult, HTTPBody } from 'index';

class MockHTTPAPIGatewayProxyResult implements HTTPAPIGatewayProxyResult {
  body: string = 'ERROR';
  headers: { [p: string]: boolean | number | string } = { key: 'value' };
  isBase64Encoded: boolean = false;
  multiValueHeaders: { [p: string]: Array<boolean | number | string> } = { key: ['value'] };
  statusCode: number = 200;

  addHeader(name: string, value: boolean | number | string): HTTPAPIGatewayProxyResult {
    return this;
  }

  addHeaders(headers: { [p: string]: boolean | number | string }): HTTPAPIGatewayProxyResult {
    return this;
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  setBody(body: string | HTTPBody): HTTPAPIGatewayProxyResult {
    if (typeof body === 'string') {
      this.body = body;
    } else {
      this.body = body.body;
    }

    return this;
  }

  setStatusCode(statusCode: number): HTTPAPIGatewayProxyResult {
    this.statusCode = statusCode;
    return this;
  }

  getBody(): string {
    return this.body;
  }

  setJSONBody(body: object) {
    this.body = JSON.stringify(body);
    return this;
  }
}

export { MockHTTPAPIGatewayProxyResult };
