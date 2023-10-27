import Ajv, { JTDParser, SchemaObject } from 'ajv/dist/jtd';
import { Logger } from '../../../utils/Logger';
import { HttpSerializer } from '../../model/HttpSerializer';
import { SerializerService } from '../SerializerService';
import { KEY } from '../../decorators/redact';
import { FieldRedacted } from '../../model/FieldRedacted';

export class JSONSerializer implements HttpSerializer {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  contentType(): string {
    return 'application/json';
  }

  request?(body: string, schema?: object): object {
    if (!schema) return JSON.parse(body);
    const parser: JTDParser = this.ajv.compileParser(schema as SchemaObject);
    return parser(body) as object;
  }

  response?(body: string | Buffer | object, schema?: object): Buffer {

    const metadata: Record<string, any> | undefined = body.constructor[SerializerService.PREFIX];
    const redacted: FieldRedacted[] | undefined = metadata?.[KEY];

    if (!body) return Buffer.from('{}');
    if (!schema) {
      Logger.trace('response() no schema.', { bodyType: typeof body });
      if (typeof body === 'string') return Buffer.from(body, 'utf-8');
      if (Buffer.isBuffer(body)) return body;
      return Buffer.from(JSON.stringify(body, (key:string, value: any) => {
        if (!redacted || value === undefined) return value;
          const redactedField: FieldRedacted | undefined = redacted.find(({field}: FieldRedacted) => field === key);
          // TODO when conditional logic added for redacting, the logic for it will need to be added here.
          // TODO Need to think about how @mu-ts/serialization should be utilized, if at all. How objects get persisted vs how
          //      they get publicly returned is often quite different.
          if (redactedField) return undefined;
          return value;
      }), 'utf-8');
    }

    return Buffer.from(this.ajv.compileSerializer(schema as SchemaObject)(body), 'utf-8');
  }
}