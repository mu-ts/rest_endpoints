export interface HttpRequest<T> {
    body?: T;
    headers?: Map<string, string>;
    path?: Map<string, string>;
    queryString?: Map<string, string>;
}