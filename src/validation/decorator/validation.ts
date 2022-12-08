import { HttpRequest } from "../../endpoints/model/HttpRequest";
import { HttpResponse } from "../../endpoints/model/HttpResponse";
import { HttpRoutes } from "../../HttpRoutes";
import { Logger } from "../../utils/Logger";
import { ValidationService } from "../service/ValidationService";




/**
 * Whatever is supplied here will be supplied to the validation object during
 * the validation of the endpoint invocation, which happens before the logic
 * itself gets invoked.
 * 
 * @param schema object used by valiation to check the inbound payload.
 * @returns 
 * 
 * TODO make it so that validation can be 'discovered' based on function name and action.
 *      IE MyObject with a post action should resolve to a file myobject.post.validation.json.
 */
export function validate(schema: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * Wrapping the function so we can intercept execution with a validation check on the
     * body of the event.
     */
    descriptor.value = async function () {

      const request: HttpRequest<string> = arguments[0];

      // TODO how to detect all the methods for the same path?
      const validationService: ValidationService | undefined = HttpRoutes.instance().validation();
      let response: HttpResponse | undefined

      if(validationService) {
        response = await validationService.validate(schema, request);
      } else {
        Logger.warn('validate() annotation is being used, but no validator is configured. Validation ignored.')
      }
      
      if (!response) response = await descriptor.value.apply(this, arguments);

      return response;
    };

    return descriptor;
  };
};