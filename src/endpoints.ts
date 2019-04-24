import { EndpointRoutes } from './EndpointRoutes';

/**
 *
 * @param pathPrefix to prepend to all endpoints within this class.
 */
export function endpoints(pathPrefix?: string) {
  return function(target: any) {
    EndpointRoutes.init(target, pathPrefix || '');
  };
}
