import { LoggerService, LogLevelString, Logger } from '@mu-ts/logger';

const decoratorLogger: Logger = LoggerService.named('decorators');
export const logger: Logger = decoratorLogger;
export function setLevel(level: LogLevelString) {
  decoratorLogger.level(level);
}
