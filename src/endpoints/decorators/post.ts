import { HttpSerializer } from "../../serializers/model/HttpSerializer";
import { Logger } from "../../utils/Logger";
import { HttpResponse } from "../model/HttpResponse";

/**
 * 
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns 
 */
export function post(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */

    /**
     * Wrap the current function so that the response will have 
     * headers added, or updated, with the cors configuration
     * provided or established within defaults.
     */
    descriptor.value = async function () {
      const [request, context] = arguments;

      if (request.body) {
        const serializer: HttpSerializer | undefined = this.serializerService.forRequest(request);
        if (serializer?.request) request.body = serializer.request(request.body);
        else Logger.warn('Router.handler() No serializer found.');
      }

      const response: HttpResponse = await descriptor.value.apply(this, request, context);
    };

    return descriptor;
  };
}
