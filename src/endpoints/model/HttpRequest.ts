export interface HttpRequest<T> {
    action: string;
    resource: string;
    path: string;
    body?: T;
    headers?: { [key: string]: string };
    pathParameters?: { [key: string]: string };
    queryString?: { [key: string]: string };
    cookies?: string[];
    requestContext: { [key: string]: any, authorizer?: { [key: string]: string } };
    authorizer?: { [key: string]: string };
}