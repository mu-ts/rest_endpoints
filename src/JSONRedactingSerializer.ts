import 'reflect-metadata';
import { HTTPSerializer } from './HTTPSerializer';
import { HTTPBody } from './HTTPBody';

const METADATA_KEY: string = '__MU-TS';
const REDACTED_KEY: string = 'redacted';

function getRedactedKeys(target: any): Array<string> {
  const metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  return metadata[REDACTED_KEY] || [];
}

/**
 * Used to ensure that values in a model are removed from the response
 * when it is being serialized.
 *
 * @param target object where the attribute is being redacted.
 * @param propertyKey of the attribute being redacted.
 * @param descriptor of the attribute being redacted.
 */
function redacted(target: any, propertyToRedact: string) {
  const metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  const redactedKeys = metadata[REDACTED_KEY] || [];

  redactedKeys.push(propertyToRedact);

  metadata[REDACTED_KEY] = redactedKeys;

  Reflect.defineMetadata(METADATA_KEY, metadata, target);
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

  public serializeResponse(responseBody: HTTPBody): string {
    const toSerialize: HTTPBody = this.redact(responseBody);
    return JSON.stringify(toSerialize);
  }

  private redact(toSerialize: HTTPBody): HTTPBody {
    const redactedKeys: Array<string> = getRedactedKeys(toSerialize);
    return Object.keys(toSerialize).reduce((newObject: HTTPBody, key: string) => {
      if (!redactedKeys.includes(key)) newObject[key] = toSerialize[key];
      return newObject;
    }, {});
  }
}
