import { CORS } from '../service/CORS';
import { HttpCORS } from '../model/HttpCORS';
import { HttpResponse } from '../../endpoints/model/HttpResponse';
import { Logger, LoggerService } from '@mu-ts/logger';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns
 */
// import { ClassMetadata } from '../../endpoints/services/ClassMetadata';
// export function id(originalMethod: any, context: ClassFieldDecoratorContext): void {
//   context.addInitializer(function (): void {
//     const { name } = context;
//     const metadata = this.constructor[ClassMetadata.PREFIX];
//     if (metadata) metadata[KEY] = name;
//   })
// };


export function cors(options?: Partial<HttpCORS>) {
  const logger: Logger = LoggerService.named('@cors()', options)
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    // TODO or we can change this so that instead of wrapping teh funciton, the Router just takes care of CORS?

    /**
     * Wrap the current function so that the response will have
     * headers added, or updated, with the cors configuration
     * provided or established within defaults.
     */
    async function corsFunction(this: any, ...args: any[]) {
      const response: HttpResponse = await originalMethod.apply(this, ...args);

      let headers: {[key: string]: string} = response.headers || {};

      logger.debug('cors() - Applying cors headers to the response.');

      headers = CORS.apply(headers, options);

      response.headers = headers;

      return response;
    };

    return corsFunction;
  };
}