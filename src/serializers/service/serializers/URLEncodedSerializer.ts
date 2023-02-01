import { HttpSerializer } from '../../model/HttpSerializer';

export class URLEncodedSerializer implements HttpSerializer {

  contentType(): string {
    return 'application/x-www-form-urlencoded';
  }

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
  public response?(body: Record<string, string>): Buffer {
    if (typeof body === 'string') return Buffer.from(body,'utf-8');
    if (Buffer.isBuffer(body)) return body;
    return Buffer.from(Object.keys(body)
      .map((key: string) => `${key}=${encodeURIComponent(body[key] as string)}`)
      .join('&'), 'utf-8');
  }
}