export interface HttpSerializer {
    request?(body: string, schema?: object): object;
    response?(body: string | Buffer | object, schema?: object): string;
}