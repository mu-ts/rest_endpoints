import { HttpRequest } from "../../endpoints/model/HttpRequest";
import { HttpResponse } from "../../endpoints/model/HttpResponse";
import { Logger } from "../../utils/Logger";
import { Validator } from "../model/Validator";
import { AJVValidator } from "./AJVValidator";


/**
 * Handles knowing how to validate the inbound request in concert
 * with the @validation decorator.
 */
export class ValidationService {

  private _validator: Validator<any>;

  constructor(provider: string | Validator<any>) {
    if (provider === 'ajv') this._validator = new AJVValidator();
    else this._validator = provider as Validator<any>;
  }

  public validator(): Validator<any> {
    return this._validator;
  }

  public validate(schema: object, request: HttpRequest<string>): HttpResponse | undefined {
    if (this._validator) {
      const errors: any[] | undefined = this._validator.validate(schema, request);

      Logger.debug('ValidationService.validate() results of validation.', { errors });

      if (errors) {

        if (this._validator.format) return this._validator.format(errors, request);

        return {
          body: { errors },
          statusCode: 400,
          statusDescription: 'The body of the requst did not pass validation.',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          }
        }
      }
    }
  }
}