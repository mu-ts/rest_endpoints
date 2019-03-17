import { HTTPEvent, HTTPResponse, HTTPBody } from "./Model";
import { Context, Callback } from "aws-lambda";
import { HTTPSerializer, JSONRedactingSerializer } from "./Serialization";

interface EndpointRoute {
  path: string;
  endpoint: Function;
  condition: Function | boolean;
  priority: number;
}

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {

  public static routes: Array<EndpointRoute> = new Array();
  public static serializer: HTTPSerializer = new JSONRedactingSerializer();

  private constructor() { }

  /**
   * 
   * @param name of the path to register this function.
   * @param funktion to execute for the path specified.
   */
  public static register(name: string, funktion: Function, condition?: Function | boolean, priority?: number): void {
    EndpointRouter.routes.push({
      path: name,
      endpoint: funktion,
      condition: condition || true,
      priority: priority || 0
    });
  }

  /**
   * 
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static handle(event: HTTPEvent, context: Context, callback: Callback<HTTPResponse>): void {
    const routePath: string = `${event.resource}:${event.httpMethod}`;
    const body: HTTPBody | null = EndpointRouter.serializer.deserializeBody(event.body);
    const routeOptions: Array<EndpointRoute> = EndpointRouter.routes
      .filter((route: EndpointRoute) => route.path === routePath)
      .filter((route: EndpointRoute) => route.condition)
      .filter((route: EndpointRoute) => {
        if (route.condition instanceof Function) {
          return route.condition(body, event);
        }
        return route;
      })
      .sort((first: EndpointRoute, second: EndpointRoute) => first.priority - second.priority);

    if (!routeOptions || routeOptions.length === 0) {
      return callback(
        null,
        new HTTPResponse({ message: 'Action is not implemented at this path.' }, 501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId)
      );
    }

    let promiseChain = Promise.resolve<HTTPResponse | undefined>(undefined);

    for (let route of routeOptions) {
      promiseChain = promiseChain.then((response: HTTPResponse | undefined) => {
        if (response) return response;
        return route.endpoint(event, context)
      })
    }

    promiseChain
      .then((response: HTTPResponse | undefined) => callback(null, response))
      .catch((error: any) => callback(error))

  }
}





// class GetUsersEndpoint {

//   constructor(){
//   }

//   @endpoint('/users:GET')
//   test(event){
//     console.log("test");
//     return Promise.resolve(new EndpointResponse(200));
//   }
// }


// EndpointRouter.handle(
//   {
//     body: null,
//     httpMethod:'GET',
//     path: '/users',
//     resource:'/users',
//     stage: 'dev',
//     headers: {},
//     queryStringParameters: {},
//     pathParameters: {},
//     requestContext: {
//       accountId: '123',
//       resourceId: '321',
//       requestId: 'xyz123',
//       authorizer: {
//         principalId:'',
//         apiKey:'',
//         sourceIp:'',
//         userAgent:''
//       }
//     }
//   },

//   {
//     callbackWaitsForEmptyEventLoop: true,
//     functionName: 'x',
//     functionVersion: 'x',
//     invokedFunctionArn: 'x',
//     memoryLimitInMB: 1,
//     awsRequestId: 'x',
//     logGroupName: 'x',
//     logStreamName: 'x',
//     identity: null,
//     clientContext: null,
//     getRemainingTimeInMillis: () => { return 1234 },
//     done: (error?: Error, result?: any) => { },
//     fail: (error: Error | string) => { },
//     succeed: (messageOrObject: any) => { }
//   },

//   (error:Error, result:any) => {
//     console.log("result",result);
//   }

// );