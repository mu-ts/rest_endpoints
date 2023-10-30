export interface HttpRequest<T> {
    action: string;
    resource: string;
    path: string;
    body?: T;
    headers?: Record<string, string>;
    pathParameters?: Record<string, string>;
    queryString?: Record<string, string>;
    cookies?: string[];
    requestContext: { [key: string]: any, authorizer?: Record<string, string> };
    authorizer?: Record<string, string>;
}
