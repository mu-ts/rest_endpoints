import { EndpointRoutes } from '../EndpointRoutes';
import { Logger, LoggerService, LoggerConfig } from '@mu-ts/logger';

/**
 *
 * @param pathPrefix to prepend to all endpoints within this class.
 */
export function endpoints(pathPrefix?: string, instanceArgs?: any[]) {
  return function(target: any) {
    const parent: string = target.constructor.name;
    const logConfig: LoggerConfig = { name: `${parent}.cors`, adornments: { '@mu-ts': 'endpoints' } };
    const logger: Logger = LoggerService.named(logConfig);
    logger.debug({ pathPrefix, instanceArgs }, 'endpoints()', 'initializing');
    EndpointRoutes.init(target, pathPrefix || '', instanceArgs);
  };
}
