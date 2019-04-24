import { Logger, ConsoleLogger, LogLevel } from '@mu-ts/logger';

export const logging: Logger = new ConsoleLogger('Decorators', LogLevel.info);

export function setLevel(level: LogLevel) {
  logging.setLevel(level);
}
