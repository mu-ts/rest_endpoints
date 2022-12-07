/**
 * The structure that the response to an HTTP endpoint must adhere to.
 */
export interface HttpResponse {
    body?: string | Buffer | object;
    isBase64Encoded?: boolean;
    headers?: { [key:string]: string };
    statusCode?: number;
    statusDescription?: string;
}