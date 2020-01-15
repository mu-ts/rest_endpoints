import { ClientContext, CognitoIdentity, Context } from 'aws-lambda';

class MockContext implements Context {
  awsRequestId: string = '';
  callbackWaitsForEmptyEventLoop: boolean = false;
  clientContext: ClientContext = {
    client: {
      installationId: '',
      appTitle: '',
      appVersionName: '',
      appVersionCode: '',
      appPackageName: '',
    },
    Custom: undefined,
    env: {
      platformVersion: '',
      platform: '',
      make: '',
      model: '',
      locale: '',
    },
  };
  functionName: string = '';
  functionVersion: string = '';
  identity: CognitoIdentity = {
    cognitoIdentityId: '',
    cognitoIdentityPoolId: '',
  };
  invokedFunctionArn: string = '';
  logGroupName: string = '';
  logStreamName: string = '';
  memoryLimitInMB: number = 128;

  done(error?: Error, result?: any): void {}

  fail(error: Error | string): void {}

  getRemainingTimeInMillis(): number {
    return 0;
  }

  succeed(messageOrObject: any): void;
  succeed(message: string, object: any): void;
  succeed(messageOrObject: any | string, object?: any): void {}
}

export { MockContext };
