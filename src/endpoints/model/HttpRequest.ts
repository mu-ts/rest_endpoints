export interface HttpRequest<T> {
    action: string;
    resource: string;
    path: string;
    body?: T;
    headers?: Map<string, string>;
    pathParameters?: Map<string, string>;
    queryString?: Map<string, string>;
    cookies?: string[];
}