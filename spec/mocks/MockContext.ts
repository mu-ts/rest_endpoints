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
  memoryLimitInMB: string = '128';

  //@ts-ignore
  done(error?: Error, result?: any): void {}

  //@ts-ignore
  fail(error: Error | string): void {}

  getRemainingTimeInMillis(): number {
    return 0;
  }

  succeed(messageOrObject: any): void;
  succeed(message: string, object: any): void;
  //@ts-ignore
  succeed(messageOrObject: any | string, object?: any): void {}
}

export { MockContext };
