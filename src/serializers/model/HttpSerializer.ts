export interface HttpSerializer {
  contentType(): string;
  isBase64?(): boolean;
  request?(body: string, schema?: object): object;
  response?(body: string | Buffer | object, schema?: object): Buffer;
}
