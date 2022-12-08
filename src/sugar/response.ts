import { HttpResponse } from "../endpoints/model/HttpResponse";

export function response(body?: string, statusCode?: number, headers?: { [key:string]: string }, statusDescription?: string): HttpResponse {
    return {
        body,
        statusCode,
        statusDescription,
        headers,
        isBase64Encoded: false,
    }
}