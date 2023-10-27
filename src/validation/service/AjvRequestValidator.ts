import Ajv, { ErrorObject, Options, ValidateFunction } from 'ajv';
import { HttpRequest } from '../../endpoints/model/HttpRequest';
import { Validator } from '../model/Validator';
import { HttpResponse } from '../../endpoints/model/HttpResponse';

import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';
import ajvKeywords from 'ajv-keywords';

export class AjvRequestValidator implements Validator<ErrorObject> {
  private static readonly UUID_REGEX = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

  constructor(
    private readonly ajv: Ajv = new Ajv({ allErrors: true, validateFormats: false, strict: false } as Options)
  ) {
    this.ajv.addKeyword({
      keyword: 'isUUID',
      validate: (schema: any, data: any) => {
        if (schema) return typeof data === 'string' && data.trim() !== '' && AjvRequestValidator.UUID_REGEX.test(data);
        return true;
      },
    });
    ajvErrors(this.ajv);
    ajvFormats(this.ajv);
    ajvKeywords(this.ajv, ['transform']);
  }

  public validate(request: HttpRequest<object>, schema: object): ErrorObject[] | undefined {
    const validate: ValidateFunction = this.ajv.compile(schema);
    const body = (typeof request.body === 'string') ? JSON.parse(request.body) : request.body;
    if (validate(body)) return undefined;

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