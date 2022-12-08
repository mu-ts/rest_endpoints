import { HttpRequest } from "../../endpoints/model/HttpRequest";
import { HttpResponse } from "../../endpoints/model/HttpResponse";
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
   * @param request
   */
  public forRequest(request: HttpRequest): HttpSerializer {
    const { headers, body } = request;
    // Content type and accept headers can have a list of options.

  }

  /**
   * @param response
   */
  public forResponse(response: HttpResponse): HttpSerializer {
    const { headers, body } = response;
    // Content type and accept headers can have a list of options.

  }
}