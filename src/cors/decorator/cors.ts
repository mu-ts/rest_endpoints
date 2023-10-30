import { CORS } from '../service/CORS';
import { HttpCORS } from '../model/HttpCORS';
import { HttpResponse } from '../../endpoints/model/HttpResponse';
import { Logger } from '../../utils/Logger';

/**
 *
 * @returns
 * @param options
 */
export function cors(options?: Partial<HttpCORS>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    /**
     * Wrap the current function so that the response will have
     * headers added, or updated, with the cors configuration
     * provided or established within defaults.
     */
    return async function (...args) {
      const response: HttpResponse = await originalMethod.apply(this, args);

      // TODO how to detect all the methods for the same path?
      const { headers = {} }: HttpResponse = response;

      Logger.debug('cors() - Applying cors headers to the response.');
      response.headers = CORS.apply(headers, options);

      return response;
    };
  };
}
