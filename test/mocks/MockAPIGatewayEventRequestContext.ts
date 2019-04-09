import { APIGatewayEventRequestContext, AuthResponseContext } from 'aws-lambda';

class MockAPIGatewayEventRequestContext implements APIGatewayEventRequestContext {
    accountId: string;
    apiId: string;
    authorizer: AuthResponseContext | null;
    connectedAt: number;
    connectionId: string;
    domainName: string;
    eventType: string;
    extendedRequestId: string;
    httpMethod: string;
    identity: { accessKey: string | null; accountId: string | null; apiKey: string | null; apiKeyId: string | null; caller: string | null; cognitoAuthenticationProvider: string | null; cognitoAuthenticationType: string | null; cognitoIdentityId: string | null; cognitoIdentityPoolId: string | null; sourceIp: string; user: string | null; userAgent: string | null; userArn: string | null };
    messageDirection: string;
    messageId: string | null;
    path: string;
    requestId: string = `x-phil-request-${new Date().getTime()}`;
    requestTime: string;
    requestTimeEpoch: number;
    resourceId: string;
    resourcePath: string;
    routeKey: string;
    stage: string;

}

export { MockAPIGatewayEventRequestContext };