import Ajv, { JTDParser, SchemaObject } from 'ajv/dist/jtd';
import { Logger } from '../../../utils/Logger';
import { HttpSerializer } from '@';

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

  response?(body?: string | Buffer | object, schema?: object): Buffer {
    if (!body) return Buffer.from('{}');
    if (!schema) {
      Logger.trace('response() no schema.', { bodyType: typeof body });
      if (typeof body === 'string') return Buffer.from(body, 'utf-8');
      if (Buffer.isBuffer(body)) return body;
      return Buffer.from(JSON.stringify(body), 'utf-8');
    }
    return Buffer.from(this.ajv.compileSerializer(schema as SchemaObject)(body), 'utf-8');
  }
}