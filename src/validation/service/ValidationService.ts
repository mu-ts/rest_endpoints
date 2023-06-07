import { Headers } from '../../endpoints/services/Headers';
import { AjvRequestValidator, HttpRequest, HttpResponse, Validator } from '@';
import { Logger } from '../../utils/Logger';

/**
 * Handles knowing how to validate the inbound request in concert
 * with the @validation decorator.
 */
export class ValidationService {

  private readonly validator: Validator<any>;

  constructor(provider: string | Validator<any> = 'ajv') {
    if (provider === 'ajv') this.validator = new AjvRequestValidator();
    else this.validator = provider as Validator<any>;
  }

  public validate(request: HttpRequest<object>, schema: object): HttpResponse | undefined {
    if (this.validator) {
      const errors: any[] | undefined = this.validator.validate(request, schema);

      Logger.debug('ValidationService.validate()', 'results of validation.', { errors: JSON.stringify(errors, undefined, 3) });

      if (errors) {
        if (this.validator.format) return this.validator.format(errors, request);
        return {
          body: { errors },
          statusCode: 400,
          headers: {
            ...Headers.get(),
            ... {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': '*',
            }
          }
        };
      }
    }
  }
}