import 'reflect-metadata';
import { expect } from 'chai';
import 'mocha';
// import { endpoints } from '../src';
import { EndpointRoutes } from '../src/EndpointRoutes';
import { EndpointRoute } from '../src/EndpointRoute';
import { MockPropertyDescriptor } from './mocks/MockPropertyDescriptor';

const METADATA_KEY: string = '__mu-ts_endpoints';

EndpointRoutes.setLogLevel('debug');

describe('EndpointRoutes', () => {
  it('init endpoints with an endpoint waiting.', () => {
    class A {}
    Reflect.defineMetadata(
      METADATA_KEY,
      [
        {
          resource: '/x',
          action: 'POST',
          endpoint: () => {},
          priority: 1,
          descriptor: new MockPropertyDescriptor(),
        },
      ],
      A
    );

    EndpointRoutes.init(A, '/x');

    const paths: EndpointRoute[] = Reflect.getMetadata(METADATA_KEY, A as Function);

    expect(paths).to.not.be.undefined;
    expect(paths)
      .to.have.property('length')
      .equal(1);
  });

  it('get instance no args.', () => {
    class B {}
    const getInstance = (EndpointRoutes as any).getInstance(B);
    expect(getInstance).to.not.be.undefined;
    expect(getInstance)
      .to.have.property('constructor')
      .to.have.property('name')
      .that.equals('B');
  });

  it('get instance with string args.', () => {
    class X {
      private test: string;
      private hello: string;
      constructor(test: string, hello: string) {
        this.test = test;
        this.hello = hello;
      }
    }
    const xInstance = (EndpointRoutes as any).getInstance(X, ['bar', 'world']);
    expect(xInstance).to.not.be.undefined;
    expect(xInstance)
      .to.have.property('constructor')
      .to.have.property('name')
      .that.equals('X');
    expect(xInstance)
      .to.have.property('test')
      .that.equals('bar');
    expect(xInstance)
      .to.have.property('hello')
      .that.equals('world');
  });
});
