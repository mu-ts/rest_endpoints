import { EndpointRoutes } from './EndpointRoutes';
import { logging } from './decorators';
import { ObjectFactory } from './ObjectFactory';

/**
 *
 * @param pathPrefix to prepend to all endpoints within this class.
 */
export function endpoints(pathPrefix?: string, objectFactory?: ObjectFactory) {
  return function(target: any) {
    logging.debug('endpoints() initializing', { pathPrefix });
    EndpointRoutes.init(target, pathPrefix || '', objectFactory);
  };
}
