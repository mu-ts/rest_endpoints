import 'reflect-metadata';
import { HTTPSerializer } from './interfaces/HTTPSerializer';
import { HTTPBody } from './model/HTTPBody';

const typeRedaction: Map<string, string[]> = new Map();
const exceptionRedaction: Map<string, string> = new Map();

/**
 * Used to ensure that values in a model are removed from the response
 * when it is being serialized.
 */
export function redacted(exceptions?: string) {
  return function(target: any, propertyToRedact: string) {
    const name = target.constructor.name.toLowerCase();

    const redactedKeys = typeRedaction.get(name) || [];
    redactedKeys.push(propertyToRedact);
    typeRedaction.set(name, redactedKeys);
    if (exceptions) {
      exceptionRedaction.set(propertyToRedact, exceptions);
    }
  };
}

/**
 * Default serializer that will respect the @redact decorator
 * and eliminate the attributes from the string returned.
 */
export class JSONRedactingSerializer implements HTTPSerializer {
  constructor() {}

  public deserializeBody(eventBody: string | undefined): HTTPBody | undefined {
    if (!eventBody) return undefined;
    return <HTTPBody>JSON.parse(eventBody);
  }

  public serializeResponse<T>(responseBody: HTTPBody, type: T, scopes?: string, role?: string): string {
    const toSerialize: HTTPBody = Array.isArray(responseBody)
      ? responseBody.map(aObj => this.redact(aObj, type, scopes, role))
      : this.redact(responseBody, type, scopes, role);
    return JSON.stringify(toSerialize);
  }

  private redact<T>(toSerialize: HTTPBody, type: string | T, scopes?: string, role?: string): HTTPBody {
    if (!type) {
      return toSerialize;
    }
    const name = typeof type === 'string' ? type : `${(<any>type)['name'].toLowerCase()}`;
    const redactedKeys: string[] = typeRedaction.get(name);
    const scopesArray: string[] = scopes?.split(' ');
    return Object.keys(toSerialize).reduce((newObject: HTTPBody, key: string) => {
      const exceptArray: string[] = exceptionRedaction.get(key)?.split(' ');
      const hasException: boolean = exceptArray?.some(except => scopesArray?.includes(except) || role === except) || false;
      const shouldInclude: boolean = !redactedKeys?.includes(key) || hasException;
      if (shouldInclude) newObject[key] = toSerialize[key];
      return newObject;
    }, {});
  }
}
