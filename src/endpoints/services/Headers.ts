export abstract class Headers {

  private static defaults: {[key: string]: string} = {};

  private constructor() {}

  /**
   * Values set here can be overridden by the lambda implementation.
   *
   * Recommend:
   * - Server: 'your company'
   * - X-Powered-By: 'your company'
   * - Set-Cookie: 'Secure'
   * - X-Frame-Options: 'DENY'
   * - Cache-Control: 'max-age=86400
   *
   * @param defaults to set on every request.
   */
  public static default(defaults: {[key: string]: string}) {
    this.defaults = defaults;
  }


  public static get( overrides?: {[key: string]: string} ): {[key: string]: string} {
      return { ...this.defaults, ...overrides || {} };
  }
}