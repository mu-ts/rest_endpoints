import { expect } from 'chai';
import { describe ,it } from 'mocha';
import { JSONSerializer } from '../../../../src/serializers/service/serializers/JSONSerializer';

describe('JSONSerializer', () => {
  let jsonSerializer: JSONSerializer;

  beforeEach(() => {
    jsonSerializer = new JSONSerializer();
  });

  it('should return "application/json" as the content type', () => {
    const contentType = jsonSerializer.contentType();
    expect(contentType).to.equal('application/json');
  });

  describe('request', () => {
    it('should parse JSON string when no schema is provided', () => {
      const requestBody = '{"name": "John", "age": 30}';
      const parsedBody = jsonSerializer.request(requestBody) as object;
      expect(parsedBody).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should validate and parse JSON using provided schema', () => {
      const requestBody = '{"name": "John", "age": 30}';
      const schema = {
        optionalProperties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
        required: ['name', 'age'],
      };
      const parsedBody = jsonSerializer.request(requestBody, schema) as object;
      expect(parsedBody).to.deep.equal({ name: 'John', age: 30 });
    });
  });

  describe('response', () => {
    it('should return a Buffer with the JSON string when no schema is provided', () => {
      const responseBody = { message: 'Success' };
      const responseBuffer = jsonSerializer.response(responseBody) as Buffer;
      const responseString = responseBuffer.toString('utf-8');
      expect(responseString).to.equal(JSON.stringify(responseBody));
    });

    it('should serialize and return a Buffer using provided schema', () => {
      const responseBody = { name: 'Alice', age: 25 };
      const schema = {
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
        required: ['name', 'age'],
      };
      const responseBuffer = jsonSerializer.response(responseBody, schema) as Buffer;
      const responseString = responseBuffer.toString('utf-8');
      expect(responseString).to.equal(JSON.stringify(responseBody));
    });
  });
});
