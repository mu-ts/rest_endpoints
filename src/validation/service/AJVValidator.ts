import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { HttpRequest } from '../../endpoints/model/HttpRequest';
import { Validator } from '../model/Validator';
import { HttpResponse } from '../../endpoints/model/HttpResponse';

export class AJVValidator implements Validator<ErrorObject> {

  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  public validate(request: HttpRequest<object>, schema: object): ErrorObject[] | undefined {
    const validate: ValidateFunction = this.ajv.compile(schema);
    if (validate(request.body)) return undefined;

    const { errors } = validate;
    if (!errors) return undefined;
    return errors;
  }

  public format(errors: ErrorObject[], request: HttpRequest<object>): HttpResponse {
    return {
      body: {
        path: request.path,
        action: request.action,
        errors: errors
          .map(({
            keyword,
            message,
            instancePath,
            params,
          }: ErrorObject) => ({
            attribute: instancePath.substring(1).replace('/', '.') || params.missingProperty || params.additionalProperty,
            message,
            keyword,
          }))
          .map(({ keyword, message, attribute }) => ({
            keyword,
            message,
            attribute: attribute === '' ? undefined : attribute,
            data: ['required', 'additionalProperties'].includes(keyword) === false ? this.get(attribute as string, request.body) : undefined,
          }))
          .map(({ message, attribute, data }) => ({
            attribute,
            message,
            data: data ? {
              value: data,
              type: data ? typeof data : undefined,
            } : undefined,
          })),
      },
      statusCode: 400,
      statusDescription: 'The body of the request did not pass validation.',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    };
  }

  private get(path: string, payload: any) {
    return path?.split('.').reduce((accumulator: { [key: string]: any | undefined }, key: string) => (accumulator[key] === undefined ? accumulator : accumulator[key]), payload as { [key: string]: any | undefined });
  }
}
