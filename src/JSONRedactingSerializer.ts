import 'reflect-metadata';
import { HTTPSerializer } from './HTTPSerializer';
import { HTTPBody } from './HTTPBody';

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
    const toSerialize: HTTPBody = (Array.isArray(responseBody)) ?
        responseBody.map((aObj) => this.redact(aObj, type, scopes, role)) : this.redact(responseBody, type, scopes, role);
    return JSON.stringify(toSerialize);
  }

  private redact<T>(toSerialize: HTTPBody, type: string | T, scopes?: string, role?: string): HTTPBody {
    if (!type) {
      return toSerialize;
    }
    const name = typeof type === 'string' ? type : `${(<any>type)['name'].toLowerCase()}`;
    const redactedKeys: Array<string> = typeRedaction.get(name) || [];
    return Object.keys(toSerialize).reduce((newObject: HTTPBody, key: string) => {
      let hasExceptions = false;
      const exceptions = exceptionRedaction.get(key);
      if (exceptions) {
        const exceptArray = exceptions.split(' ');
        hasExceptions = exceptArray.some( (ex) => (scopes && scopes.includes(ex)) || (role && role.includes(ex)) );
      }
      if (!redactedKeys.includes(key) || hasExceptions) newObject[key] = toSerialize[key];
      return newObject;
    }, {});
  }
}
