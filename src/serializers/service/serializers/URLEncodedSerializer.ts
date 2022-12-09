import { HttpSerializer } from "../../model/HttpSerializer";

export class URLEncodedSerializer implements HttpSerializer {
  
  /**
   * 
   * @param body in the querystring format, converted to an object.
   * @returns 
   */
  public request?(body: string): object {
    return body.split('&')
      .reduce((accumulator: any, kvp: string) => {
        const [key, value] = kvp.split('=');
        accumulator[key] = decodeURIComponent(value);
        return accumulator;
      }, {});
  }

  /**
   * 
   * @param body string or buffers are returned, objects are expected to be flat.
   * @returns 
   */
  public response?(body: Record<string, string>): string {
    if (typeof body === 'string') return body;
    if (Buffer.isBuffer(body)) return JSON.stringify(body.toString('utf8'));
    return Object.keys(body)
      .map((key:string) => `${key}=${encodeURIComponent(body[key] as string)}`)
      .join('&');
  }
}