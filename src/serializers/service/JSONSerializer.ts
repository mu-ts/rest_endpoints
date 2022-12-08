import { HttpSerializer } from "../model/HttpSerializer";

export class JSONSerializer implements HttpSerializer {
  
  public request?(body: string): string {
    return JSON.parse(body);
  }

  public response?(body: string | Buffer | object): string {
    // TODO respect 'redact' or omitting attributes.
    if (typeof body === 'string') return body;
    if (Buffer.isBuffer(body)) return JSON.stringify(body.toString('utf8'));
    return JSON.stringify(body);
  }
}