import { expect } from 'chai';
import 'mocha';
import { EndpointRouter } from '../src/EndpointRouter';

describe('EndpointRouter', () => {

    it('should succeed', () => {

        EndpointRouter.attachValidationHandler('nothing valid');

    });

});
