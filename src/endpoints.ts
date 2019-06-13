import { EndpointRoutes } from './EndpointRoutes';
import { logger } from './decorators';

/**
 *
 * @param pathPrefix to prepend to all endpoints within this class.
 */
export function endpoints(pathPrefix?: string, instanceArgs?: any[]) {
  return function(target: any) {
    logger.debug({ data: { pathPrefix, instanceArgs } }, 'endpoints() initializing');
    EndpointRoutes.init(target, pathPrefix || '', instanceArgs);
  };
}
