import { EndpointEvent, EndpointResponse } from "./Model";
import { Context, Callback } from "aws-lambda";
import { endpoint } from "./endpoints";

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  public static routes:Map<string,Function> = new Map();

  /**
   * 
   * @param name of the path to register this function.
   * @param funktion to execute for the path specified.
   */
  public static register(name:string, funktion:Function): void {
    if(!EndpointRouter.get(name)) EndpointRouter.routes.set(name,funktion);
  }

  /**
   * 
   * @param name to check the existance of.
   */
  public static exists(name:string):boolean{
    return !!EndpointRouter.routes.get(name);
  }

  /**
   * 
   * @param name of path to return the function for.
   */
  public static get(name:string): Function {
    return EndpointRouter.routes.get(name);
  }

  /**
   * 
   * @param path to list all the available actions for.
   */
  public static getActions(path:string):Array<string> {
    return Array.from(EndpointRouter.routes.keys())
      .filter( (route:string) => route.startsWith(`${path}:`) )
      .map( (route:string) => route.substring(route.indexOf(':')));
  }

  /**
   * 
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static handle(event:EndpointEvent, context:Context, callback:Callback<EndpointResponse>):void {
    const route:string      = `${event.resource}:${event.httpMethod}`;
    const funktion:Function = EndpointRouter.routes.get(route);

    if(!funktion) {

      const response:EndpointResponse = new EndpointResponse(
        501,
        { message:'Action is not implemented at this path.' },
        { 'X-REQUEST-ID': event.requestContext.requestId }
      );
      response.setCORS('*','*',true)

      callback(null, response);
    } else {

      funktion(event,context)
        .then( (response:EndpointResponse) => callback(null,response) )
        .catch( error => callback(error) )
    }
   
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