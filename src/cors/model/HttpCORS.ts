/**
 * Provides the ability to define default values that will be returned on all requests.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#the_http_response_headers
 */
export interface HttpCORS {
    /**
     * If not specified then * is used.
     * Default: *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-allow-origin
     */
    allowOrigin?: string;

    /**
     * Used in concert with origin, this will allow different subdomains on the TLD to
     * access the resource.
     * (optional)
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
     */
    vary?: string;

    /**
     * Limits how long the OPTION response can be cached by the browser for, in seconds.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-max-age
     */
    maxAge?: number;

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-max-age
     */
    allowCredentials?: boolean;

    /**
     * Generally kept in sync with allowedMethods with the addition of 'OPTIONS'
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-request-method
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method
     */
    requestMethod?: string;

    /**
     * Determines what methods the browser will be permitted to send back
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-allow-methods
     */
    allowedMethods?: string[];

    /**
     * What headers will be permitted to be read by the browser.
     * Default: Authorization, Content-Type, Allow
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-allow-headers
     */
    allowHeaders?: string[];

    /**
     * The header values that should be returned to the browser in the response.
     * (optional)
     * Defaults will vary but are good faith efforts to return only necessary and valuable headers.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
     */
    exposeHeaders?: string[];
}