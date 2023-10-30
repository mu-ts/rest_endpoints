import { Headers } from '../../endpoints/services/Headers';
import { HttpRequest } from '../../endpoints/model/HttpRequest';
import { HttpResponse } from '../../endpoints/model/HttpResponse';
import { Logger } from '../../utils/Logger';
import { Validator } from '../model/Validator';
import { AjvRequestValidator } from './AjvRequestValidator';

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
    if (!this.validator) return undefined;

    const errors: any[] | undefined = this.validator.validate(request, schema);
    if (!errors) return undefined;

    Logger.debug('ValidationService.validate()', 'results of validation.', { errors: JSON.stringify(errors, undefined, 3) });
    if (this.validator.format) return this.validator.format(errors, request);
    return {
      body: { errors },
      statusCode: 400,
      headers: {
        ...Headers.get(),
        ...{
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
      },
    };
  }
}
