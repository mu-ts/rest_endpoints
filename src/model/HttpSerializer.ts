export interface HttpSerializer {
    request?(body: string): string;
    response?(body: string | Buffer | object): string;
}