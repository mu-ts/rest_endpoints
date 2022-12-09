import { HttpRequest } from "../../endpoints/model/HttpRequest";
import { HttpResponse } from "../../endpoints/model/HttpResponse";
import { HttpSerializer } from "../model/HttpSerializer";
import { JSONSerializer } from "./serializers/JSONSerializer";
import { URLEncodedSerializer } from "./serializers/URLEncodedSerializer";
export class SerializerService {

  private readonly serializers: { [key:string]: HttpSerializer };

  constructor(){
    this.serializers = {
      'application/json': new JSONSerializer(),
      'application/x-www-form-urlencoded': new URLEncodedSerializer(),
    };
  }

  public register(mimeType: string, serializer: HttpSerializer) {
    this.serializers[mimeType] = serializer;
  }

  /**
   * @param request to find the content-type of the payload from.
   */
  public forRequest(request: HttpRequest<string>): HttpSerializer | undefined {
    const contentType: string = request.headers?.['Content-Type'] || request.headers?.['content-type'] || '';
    return this.findSerializer(...this.toArray(contentType))
  }

  /**
   * Prefering the request accept header if present, but allow the content-type of the response
   * to participate if there is no serializer found for the accept header values.
   * 
   * @param response
   */
  public forResponse(request: HttpRequest<object>, response: HttpResponse): HttpSerializer | undefined {
    const accept: string = request.headers?.['Accept'] || request.headers?.['accept'] || '';
    const contentType: string = response.headers?.['Content-Type'] || response.headers?.['content-type'] || '';
    return this.findSerializer(...this.toArray(accept), ...this.toArray(contentType))
  }

  private findSerializer(...mimeTypes: string[]) {
    
    /**
     * application/json is an always default, since this is all running Node/JS
     */
    const supportedMimeTypes: string[] = Object.keys(this.serializers);
    const mimeType: string | undefined = [...mimeTypes, 'application/json']
      .filter(this.uniqueFilter)
      .filter(this.badValueFilter)
      .find((mimeType:string) => supportedMimeTypes.includes(mimeType));

    if (!mimeType) return undefined;
  }

  private toArray(headerValue:string):string[] {
    return headerValue
      .split(',')
      .map((header:string) => header.indexOf(';') !== -1 ? header.substring(0, header.indexOf(';')) : header)
      .map((header:string) => header.trim().toLocaleLowerCase());
  }

  private uniqueFilter(value:string, index:number, self: string[]) {
    return self.indexOf(value) === index;
  }

  private badValueFilter(value:string, index:number, self: string[]) {
    return value !== '' && value !== undefined;
  }
}