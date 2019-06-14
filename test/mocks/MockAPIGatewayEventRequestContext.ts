import { APIGatewayEventRequestContext, AuthResponseContext } from 'aws-lambda';

class MockAPIGatewayEventRequestContext implements APIGatewayEventRequestContext {
  accountId: string = '';
  apiId: string = '';
  authorizer: AuthResponseContext | null = null;
  connectedAt: number = 0;
  connectionId: string = '';
  domainName: string = '';
  eventType: string = '';
  extendedRequestId: string = '';
  httpMethod: string = '';
  identity: {
    accessKey: null;
    accountId: null;
    apiKey: null;
    apiKeyId: null;
    caller: null;
    cognitoAuthenticationProvider: null;
    cognitoAuthenticationType: null;
    cognitoIdentityId: null;
    cognitoIdentityPoolId: null;
    sourceIp: 'string';
    user: null;
    userAgent: null;
    userArn: null;
  };
  messageDirection: string = '';
  messageId: null = null;
  path: string = '';
  requestId: string = `x-phil-request-${new Date().getTime()}`;
  requestTime: string = '';
  requestTimeEpoch: number = 0;
  resourceId: string = '';
  resourcePath: string = '';
  routeKey: string = '';
  stage: string = '';
  constructor() {
    this.identity = {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      sourceIp: 'string',
      user: null,
      userAgent: null,
      userArn: null,
    };
  }
}

export { MockAPIGatewayEventRequestContext };
