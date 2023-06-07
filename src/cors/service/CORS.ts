import { HttpCORS } from '@';

export abstract class CORS {

  private static cors: HttpCORS | undefined;

  private constructor() {}

  public static configure(cors: HttpCORS) {
    this.cors = cors;
  }

  /**
   * Applies the cors configuration to the header object provided.
   *
   * @param headers to apply the CORS headers to
   * @param cors to apply the CORS headers to
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
   */
  public static apply(headers: {[key: string]: string}, cors?: HttpCORS): {[key: string]: string} {
    if (!cors && !this.cors) return headers;
    const source: HttpCORS = { ...this.cors || {}, ...cors || {} };
    const { allowOrigin, vary, exposeHeaders, maxAge, allowCredentials, allowHeaders, allowedMethods, requestMethod } = source;
    if (allowOrigin) {
        headers['Access-Control-Allow-Origin'] = allowOrigin;
        if (vary) headers['Vary'] = vary;
    }
    if (exposeHeaders) headers['Access-Control-Expose-Headers'] = exposeHeaders.join(', ');
    if (allowedMethods) headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
    if (allowHeaders) headers['Access-Control-Allow-Headers'] = allowHeaders.join(', ');
    if (requestMethod) headers['Access-Control-Request-Method'] = requestMethod;
    if (allowCredentials) headers['Access-Control-Allow-Credentials'] = `${allowCredentials}`;
    if (maxAge) headers['Access-Control-Max-Age'] = `${maxAge}`;
    return headers;
  }
}