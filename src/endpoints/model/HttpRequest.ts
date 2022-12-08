export interface HttpRequest<T> {
    action: string;
    resource: string;
    path: string;
    body?: T;
    headers?: { [key:string]: string };
    pathParameters?: { [key:string]: string };
    queryString?: { [key:string]: string };
    cookies?: string[];
}