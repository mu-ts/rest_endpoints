import { HttpRequest } from '../../endpoints/model/HttpRequest';
import { HttpResponse } from '../../endpoints/model/HttpResponse';
import { Logger } from '../../utils/Logger';
import { Validator } from '../model/Validator';
import { AJVValidator } from './AJVValidator';


/**
 * Handles knowing how to validate the inbound request in concert
 * with the @validation decorator.
 */
export class ValidationService {

  private readonly validator: Validator<any>;

  constructor(provider: string | Validator<any>) {
    if (provider === 'ajv') this.validator = new AJVValidator();
    else this.validator = provider as Validator<any>;
  }

  public validate(request: HttpRequest<object>, schema: object): HttpResponse | undefined {
    if (this.validator) {
      const errors: any[] | undefined = this.validator.validate(request, schema);
      Logger.debug('ValidationService.validate() results of validation.', { errors });

      if (errors) {
        if (this.validator.format) return this.validator.format(errors, request);
        return {
          body: { errors },
          statusCode: 400,
          statusDescription: 'The body of the request did not pass validation.',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          }
        };
      }
    }
  }
}