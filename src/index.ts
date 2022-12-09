/**
 * Entrypoint object.
 */
// export * from './HttpRoutes';

// /**
//  * Decorators
//  */
// export * from './cors/decorator/cors';
// export * from './serializers/decorators/output';
// export * from './validation/decorator/validation';
// export * from './endpoints/decorators/any';
// export * from './endpoints/decorators/get';
// export * from './endpoints/decorators/option';
// export * from './endpoints/decorators/patch';
// export * from './endpoints/decorators/post';
// export * from './endpoints/decorators/put';
// export * from './endpoints/decorators/xdelete';

// /**
//  * Sugar
//  */
// export * from './sugar/json';
// export * from './sugar/response';

// /**
//  * Public model
//  */
// export * from './endpoints/model/HttpRequest';
// export * from './endpoints/model/HttpResponse';
// export * from './validation/model/Validator';
// export * from './serializers/model/HttpSerializer';
// export * from './cors/model/HttpCORS';

import { response } from './sugar/response';
import { HttpRequest } from './endpoints/model/HttpRequest';
import { HttpResponse } from './endpoints/model/HttpResponse';
import { post } from './endpoints/decorators/post';
// import { output } from './serializers/decorators/output';
import { cors } from './cors/decorator/cors';
import { HttpHandler } from './HttpHandler';
import { LambdaContext } from './endpoints/model/LambdaContext';

interface MyBody {
  name: string;
}

class MyExample {
  @post('/users', {
    type: "object",
    properties: {
      age: {type: "integer"},
      name: {type: "string"}
    },
    required: ["foo"],
    additionalProperties: false
  })
  @cors({
    allowedMethods: ['POST', 'GET'],
  })
  // @output()
  public async create({body}: HttpRequest<MyBody>): Promise<HttpResponse> {
    console.log("Body", typeof body);
    return response(200);
  }
}

new MyExample()

console.time('track');
const handler = HttpHandler
  .instance()
  .validation({
    validate(request: HttpRequest<object>, schema: object) {
      console.log('pass through validation.', { schema });
      return undefined;
    }
  })
  .router()
  .handle(
    {
      "version": "1.0",
      "resource": "/users",
      "path": "/users",
      "httpMethod": "POST",
      "headers": {
        "content-type": "image/png",
        "header2": "value2"
      },
      "queryStringParameters": {
        "parameter1": "value1",
        "parameter2": "value"
      },
      "requestContext": {
        "accountId": "123456789012",
        "apiId": "id",
        "authorizer": {
          "claims": null,
          "scopes": null
        },
        "domainName": "id.execute-api.us-east-1.amazonaws.com",
        "domainPrefix": "id",
        "extendedRequestId": "request-id",
        "httpMethod": "POST",
        "identity": {
          "accessKey": null,
          "accountId": null,
          "caller": null,
          "cognitoAuthenticationProvider": null,
          "cognitoAuthenticationType": null,
          "cognitoIdentityId": null,
          "cognitoIdentityPoolId": null,
          "principalOrgId": null,
          "sourceIp": "192.0.2.1",
          "user": null,
          "userAgent": "user-agent",
          "userArn": null,
          "clientCert": {
            "clientCertPem": "CERT_CONTENT",
            "subjectDN": "www.example.com",
            "issuerDN": "Example issuer",
            "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
            "validity": {
              "notBefore": "May 28 12:30:02 2019 GMT",
              "notAfter": "Aug  5 09:36:04 2021 GMT"
            }
          }
        },
        "path": "/users",
        "protocol": "HTTP/1.1",
        "requestId": "id=",
        "requestTime": "04/Mar/2020:19:15:17 +0000",
        "requestTimeEpoch": 1583349317135,
        "resourceId": null,
        "resourcePath": "/users",
        "stage": "$default"
      },
      "pathParameters": {
        "thing-id": "some"
      },
      "stageVariables": null,
      "body": Buffer.from(`{"name":"Timmy"}`),
      "isBase64Encoded": false
    },
    { awsRequestId: 'local' } as LambdaContext
  )
  .then(console.log)
  .finally(() => console.timeEnd('track'))

/**
 * @validation(json('./create.x.validation.json))
 * @output(json('./create.x.output.json'))
 * @cors()
 * @get('/v3/users')
 * public create(request: HttpRequest): Promise<HttpResponse>;
 */