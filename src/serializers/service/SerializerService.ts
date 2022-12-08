import { HttpSerializer } from "../model/HttpSerializer";

export class SerializerService {

  private readonly serializers: { [key:string]: HttpSerializer };

  constructor(){
    this.serializers = {};
  }

  public register(mimeType: string, serializer: HttpSerializer) {
    this.serializers[mimeType] = serializer;
  }

  /**
   * @param headers to look for mime types within. Make sure that the values are in the order 
   *        of preference. First one being highest priority, all others lower. Each header will
   *        be parsed according to supported HTTP spec on content-type and accept headers.
   */
  public find(...headers: string[]): HttpSerializer {
    // Content type and accept headers can have a list of options.

  }
}