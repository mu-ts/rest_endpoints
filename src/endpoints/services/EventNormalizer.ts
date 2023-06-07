import { HttpRequest } from '@';

/**
 * Converts the payload received by the lambda event to a common format
 * for all implementing functions to use.
 *
 * This format intentionally omits some information in some cases because
 * it is being dropped going forward and in other cases because it is
 * never utilized.
 *
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
 */
export class EventNormalizer {
  constructor() {
  }

  public static normalize(event: any): HttpRequest<string> {
    if (event.version === '2.0') {
      const { requestContext, routeKey, rawPath, body, headers, queryStringParameters, cookies, pathParameters, } = event;
      const { http, authorizer }  = requestContext;
      const [ignore, resource] = routeKey.split(' ');
      return {
        action: http.method,
        resource,
        path: rawPath,
        body,
        headers,
        cookies,
        pathParameters,
        queryString: queryStringParameters,
        requestContext,
        authorizer,
      };
    } else {
      const { resource, path, httpMethod, headers, queryStringParameters, pathParameters, body, requestContext } = event;
      const { authorizer }  = requestContext;
      return {
        action: httpMethod,
        resource,
        path,
        body,
        headers,
        pathParameters,
        queryString: queryStringParameters,
        requestContext,
        authorizer,
      };
    }
  }
}