import { CORS } from '../service/CORS';
import { HttpCORS } from '../model/HttpCORS';
import { HttpResponse } from '../../endpoints/model/HttpResponse';
import { Logger } from '../../utils/Logger';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns
 */
export function cors(options?: Partial<HttpCORS>) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    /**
     * Wrap the current function so that the response will have
     * headers added, or updated, with the cors configuration
     * provided or established within defaults.
     */
    return async function (...args) {
      const response: HttpResponse = await originalMethod.apply(this, args);

      // TODO how to detect all the methods for the same path?

      let headers: {[key: string]: string} = response.headers || {};

      Logger.debug('cors() - Applying cors headers to the response.');

      headers = CORS.apply(headers, options);

      response.headers = headers;

      return response;
    };
  };
  }