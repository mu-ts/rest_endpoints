import 'mocha';
import { endpoint, HTTPAPIGatewayProxyResult } from '../src';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { MockAPIGatewayProxyEvent } from './mocks/MockAPIGatewayProxyEvent';
import { MockContext } from './mocks/MockContext';
import { MockHTTPAPIGatewayProxyResult } from './mocks/MockHTTPAPIGatewayProxyResult';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { MockPropertyDescriptor } from './mocks/MockPropertyDescriptor';

chai.use(chaiAsPromised);
chai.should();

describe('EndpointDecorator', () => {
  it('should properly resolve with a body as defined in the mock', () => {
    class X {
      test() {}
    }
    const event: APIGatewayProxyEvent = new MockAPIGatewayProxyEvent();
    const result: HTTPAPIGatewayProxyResult = new MockHTTPAPIGatewayProxyResult().setJSONBody({ hello: 'world' });

    const decorator: Function = endpoint('/list', 'get');
    const mockDescriptor: PropertyDescriptor = new MockPropertyDescriptor();
    const descriptor: PropertyDescriptor = decorator(X, 'test', mockDescriptor).setValue(result);

    const endpointPromise: Promise<MockHTTPAPIGatewayProxyResult> = descriptor.value(event, new MockContext(), []);

    return Promise.all([
      endpointPromise.should.eventually.have.property('body'),
      endpointPromise.should.eventually.have.property('body').that.equals('{"hello":"world"}'),
      endpointPromise.should.eventually.have.property('statusCode'),
      endpointPromise.should.eventually.have.property('statusCode').that.equals(200),
    ]);
  });

  it('should properly allow the status override on the result object to be reflected from decorator call', () => {
    const decorator = endpoint('/list', 'get');

    const event: APIGatewayProxyEvent = new MockAPIGatewayProxyEvent();
    const result: HTTPAPIGatewayProxyResult = new MockHTTPAPIGatewayProxyResult()
      .setJSONBody({ hello: 'world' })
      .setStatusCode(420);

    const descriptor: PropertyDescriptor = decorator(event, 'key', new MockPropertyDescriptor().setValue(result));

    const endpointPromise: Promise<HTTPAPIGatewayProxyResult> = descriptor.value(event, new MockContext(), []);

    return Promise.all([
      endpointPromise.should.eventually.have.property('statusCode'),
      endpointPromise.should.eventually.have.property('statusCode').that.equals(420),
    ]);
  });
});
