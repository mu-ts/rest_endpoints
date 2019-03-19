import { METADATA_KEY, REDACTED_KEY } from "./decorators";
import { HTTPBody } from "./Model";

export interface HTTPSerializer {
  /**
   * Called when the EndpointROuter creates an HTTPBody from the body
   * attribute of an HTTPEvent.
   * 
   * @param event 
   */
  deserializeBody(eventBody: string | undefined): HTTPBody | undefined;

  /**
   * Called to serialize the HTTPBody of a response into a string. Will
   * take care of redacting attributes marked with @redacted so that
   * bleeding of sensitive information does not happen.
   * 
   * @param response 
   */
  serializeResponse(responseBody: HTTPBody): string;
}


function getRedactedKeys(target: any): Array<string> {
  const metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  return metadata[REDACTED_KEY] || [];
}

/**
 * Default serializer that will respect the @redact decorator
 * and eliminate the attributes from the string returned.
 */
export class JSONRedactingSerializer implements HTTPSerializer {

  constructor() {
  }

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
    return Object.keys(toSerialize)
      .reduce((newObject: HTTPBody, key: string) => {
        if (!redactedKeys.includes(key)) newObject[key] = toSerialize[key];
        return newObject;
      }, {});
  }

}
