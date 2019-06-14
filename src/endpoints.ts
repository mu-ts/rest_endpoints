import { EndpointRoutes } from './EndpointRoutes';
import { Logger, LoggerService } from '@mu-ts/logger';

/**
 *
 * @param pathPrefix to prepend to all endpoints within this class.
 */
export function endpoints(pathPrefix?: string, instanceArgs?: any[]) {
  const logger: Logger = LoggerService.named('endpoints', { fwk: '@mu-ts' });
  return function(target: any) {
    logger.debug({ data: { pathPrefix, instanceArgs } }, 'endpoints() initializing');
    EndpointRoutes.init(target, pathPrefix || '', instanceArgs);
  };
}
