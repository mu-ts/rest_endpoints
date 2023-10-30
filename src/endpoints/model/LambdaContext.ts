/**
 * Providing our own context interface to avoid an external dependency of @types/aws-lambda.
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
 */
export interface LambdaContext {
  functionName: string;

  functionVersion: string;

  invokedFunctionArn: string;

  memoryLimitInMB: string;

  awsRequestId: string;

  logGroupName: string;

  logStreamName: string;
}
