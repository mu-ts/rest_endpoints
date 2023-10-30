/**
 * The structure that the response to an HTTP endpoint must adhere to.
 */
export interface HttpResponse {
    body?: string | object | Buffer;
    isBase64Encoded?: boolean;
    headers?: Record<string, string>;
    statusCode?: number;
    statusDescription?: string;
    cookies?: string[];
    _valid?: boolean;
}
