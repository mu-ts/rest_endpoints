import { expect } from 'chai';
import 'mocha';
import { EndpointRouter } from '../src/';

// describe('LoggerService', () => {
//   describe('setLoggerFactory()', () => {
//     it('set a valid LoggerFactory', () => {
//       expect(() => LoggerService.setLoggerFactory(new MockLoggerFactory())).to.not.throw(Error);
//     });

//     it('fail if LoggerFactory is invalid', () => {
//       expect(() => LoggerService.setLoggerFactory({} as LoggerFactory)).to.throw(Error);
//     });
//   });

describe('EndpointRouter', () => {
  describe('new instance', () => {
    it('should create without errors', () => {
      expect(() => new (EndpointRouter as any)()).to.not.throw(Error);
    });
  });

  it('should not have validation on a specific endpoint if not defined', () => {});

  it('should register an endpoint that is provided', () => {});

  it('should only apply a validation if the condition deems it necessary from the request', () => {});

  it('should apply multiple validation schemes if the condition applies to multiple schemes', () => {});

  it('should fail when an implementation is provided as a validation handler, but does not conform to the required contract (.validate())', () => {
    // This will not validate correctly currently. Write the unit tests to verify those that
    // will work and those that won't, and instead throw the exception below. After that, adjust
    // the actual implementation code to make the test prove that the new logic works.
    // expect(EndpointRouter.attachValidationHandler(function() {})).to.throw(new Error('Invalid validator supplied'));
  });
});
