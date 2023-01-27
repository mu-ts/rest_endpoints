import Ajv, { JTDParser, SchemaObject } from 'ajv/dist/jtd';
import { HttpSerializer } from '../../model/HttpSerializer';

export class JSONSerializer implements HttpSerializer {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  request?(body: string, schema?: object): object {
    if (!schema) return JSON.parse(body);
    const parser: JTDParser =  this.ajv.compileParser(schema as SchemaObject);
    return parser(body) as object;
  }

  response?(body: string | Buffer | object, schema?: object): string {
    if (!schema) {
      if (typeof body === 'string') return body;
      if (Buffer.isBuffer(body)) return JSON.stringify(body.toString('utf8'));
      return JSON.stringify(body);
    }
    return this.ajv.compileSerializer(schema as SchemaObject)(body);
  }
}