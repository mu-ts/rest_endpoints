import 'reflect-metadata';
import { HTTPSerializer } from './HTTPSerializer';
import { HTTPBody } from './HTTPBody';

const typeRedaction: Map<string, string[]> = new Map();

/**
 * Used to ensure that values in a model are removed from the response
 * when it is being serialized.
 */
export function redacted() {
  return function(target: any, propertyToRedact: string) {
    const redactedKeys = typeRedaction.get(target.constructor.name) || [];
    redactedKeys.push(propertyToRedact);
    typeRedaction.set(target.constructor.name, redactedKeys);
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

  public serializeResponse<T>(responseBody: HTTPBody, type: T): string {
    const toSerialize: HTTPBody = this.redact(responseBody, type);
    return JSON.stringify(toSerialize);
  }

  private redact<T>(toSerialize: HTTPBody, type: string | T): HTTPBody {
    if (!type) {
      return toSerialize;
    }
    const name = typeof type === 'string' ? type : `${(<any>type)['name'].toLowerCase()}`;
    const redactedKeys: Array<string> = typeRedaction.get(name) || [];
    return Object.keys(toSerialize).reduce((newObject: HTTPBody, key: string) => {
      if (!redactedKeys.includes(key)) newObject[key] = toSerialize[key];
      return newObject;
    }, {});
  }
}
