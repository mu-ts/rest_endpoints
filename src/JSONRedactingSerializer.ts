import 'reflect-metadata';
import { HTTPSerializer } from './interfaces';
import { HTTPBody } from './model';

const typeRedaction: Map<string, string[]> = new Map();
const redactionExceptions: Map<string, string> = new Map();
const redactionAdjustments: Map<string, {[role: string]: (target: any) => any}> = new Map();

/**
 * Used to ensure that values in a model are removed from the response
 * when it is being serialized.
 */
export function redacted(exceptions?: string, adjustments?: {[role: string]: (target: any) => any}) {
  return (target: any, propertyToRedact: string) => {
    const name = target.constructor.name.toLowerCase();

    const redactedKeys = typeRedaction.get(name) || [];
    redactedKeys.push(propertyToRedact);
    typeRedaction.set(name, redactedKeys);

    if (exceptions) redactionExceptions.set(propertyToRedact, exceptions);
    if (adjustments) redactionAdjustments.set(propertyToRedact, adjustments);
  };
}

/**
 * Default serializer that will respect the @redact decorator
 * and eliminate the attributes from the string returned.
 */
export class JSONRedactingSerializer implements HTTPSerializer {
  constructor() {}

  public deserializeBody(contentTypes: string | undefined, eventBody: string | undefined): HTTPBody | undefined {
    if (!eventBody?.trim()) return undefined;
    const contentType: string = contentTypes?.split(';').shift(); // get first
    switch (contentType) {
      case 'application/x-www-form-urlencoded':
        return eventBody.split('&')
            .reduce((accumulator: any, kvp: string) => {
              const [key, value] = kvp.split('=');
              accumulator[key] = decodeURIComponent(value);
              return accumulator;
            }, {});
      case 'application/json':
        return JSON.parse(eventBody);
      default:
        return undefined;
    }
  }

  public serializeResponse<T>(responseBody: HTTPBody, type: T[], scopes?: string, role?: string): string {
    const toSerialize: HTTPBody = Array.isArray(responseBody)
      ? responseBody.map(aObj => this.redact(aObj, type, scopes, role))
      : this.redact(responseBody, type, scopes, role);
    return JSON.stringify(toSerialize);
  }

  private static getName(type: unknown) {
    switch (typeof type) {
      case 'string':
        return type.toLowerCase();
      case 'function':
        return `${(type as any).name.toLowerCase()}`;
      case 'object':
      default:
        return `${(type as any).constructor.name.toLowerCase()}`;
    }
  }

  private redact<T>(toSerialize: HTTPBody, type: string | T[], scopes?: string, role?: string): HTTPBody {
    if (!type) return toSerialize;

    const redactedKeys: string[] = (Array.isArray(type))
        ? type.map((ty: T) => typeRedaction.get(JSONRedactingSerializer.getName(ty)) as string[]).flat()
        : typeRedaction.get(JSONRedactingSerializer.getName(type)) as string[];

    const scopesArray: string[] = scopes?.split(' ');
    return Object.keys(toSerialize).reduce((newObject: HTTPBody, key: string) => {
      const exceptArray: string[] = redactionExceptions.get(key)?.split(' ');
      const hasException: boolean = exceptArray?.some(except => scopesArray?.includes(except) || role === except) || false;
      const shouldInclude: boolean = !redactedKeys?.includes(key) || hasException;
      if (shouldInclude) {
        if (redactionAdjustments.get(key)?.[role]) {
          newObject[key] = redactionAdjustments.get(key)[role](toSerialize[key]);
        } else {
          newObject[key] = toSerialize[key];
        }
      }
      return newObject;
    }, {});
  }
}
