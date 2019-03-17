import 'reflect-metadata';
import { HTTPHeaders, HTTPResponse } from "./Model";

export const METADATA_KEY: string = '__MU-TS';
export const REDACTED_KEY: string = 'redacted';

/**
 * 
 * @param target object where the attribute is being redacted.
 * @param propertyKey of the attribute being redacted.
 * @param descriptor of the attribute being redacted.
 */
export function redacted(target: any, propertyToRedact: string) {
  const metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  const redactedKeys = metadata[REDACTED_KEY] || [];

  redactedKeys.push(propertyToRedact);

  metadata[REDACTED_KEY] = redactedKeys;

  Reflect.defineMetadata(METADATA_KEY, metadata, target);
};


// /**
//  * 
//  * @param route for this function.
//  */
// export function endpoint(route: string, cors: boolean = true, roles: Array<string> = []) {
//   return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

//     /**
//      * Only needs to be initialized once. After that the decorator no longer needs to participate in the execution of
//      * the function.
//      */
//     if (!EndpointRouter.exists(route)) {

//       console.log("init");

//       function wrapedFunction(): Promise<EndpointResponse> {

//         const event: EndpointEvent = arguments[0]; //TODO get role

//         // const role                      = event.
//         //TODO if role not in roles, then return 403

//         return descriptor.value.apply(this, arguments)
//           .then((response: EndpointResponse) => {

//             if (!response.headers) response.headers = {};

//             // response.headers['X-Frame-Options'] = 'DENY'; Should be deteremined from JWT payload.            
//             // if(!response.headers['Cache-Control']) response.headers['Cache-Control'] = 30; //TODO pull from config
//             if (!response.headers['X-REQUEST-ID']) response.headers['X-REQUEST-ID'] = event.requestContext.requestId;

//             /*
//               * Never cache 404 responses.
//               */
//             if (response.statusCode === 404) {
//               response.headers['Cache-Control'] = 'no-cache';
//             }

//             if (cors) {
//               const path = route.substring(0, route.indexOf(':'));

//               //TODO Get ORIGIN from JWT payload.
//               response.setCORS(
//                 '*',
//                 EndpointRouter.getActions(path).join(', '),
//                 true,
//                 Object.keys(response.headers).join(', ')
//               );
//             }

//             return response;
//           })
//           .catch((error) => {
//             console.log("error", error);
//             const response: EndpointResponse = new EndpointResponse(
//               500,
//               { message: error.message },
//               { 'X-REQUEST-ID': event.requestContext.requestId }
//             );
//             response.setCORS('*', '*', true);
//             return response;
//           });
//       };

//       EndpointRouter.register(route, wrapedFunction);
//     }
//   };
// }

/**
 * Needs to be placed after the @endpoints decorator.
 * 
 * @param Defines the COR's configuration for a specific endpoint.
 */
export function cors(origin: string = '*', actions?: Array<string>, allowCredentials: boolean = true, allowedHeaders?: HTTPHeaders) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const targetMethod = descriptor.value;

    descriptor.value = function () {
      return targetMethod.apply(this, arguments)
        .then((response: HTTPResponse) => {

          response.addHeaders({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': allowCredentials ? 'true' : 'false'
          })

          if (actions) response.addHeader('Access-Control-Allow-Methods', actions.join(', '));
          if (allowedHeaders) response.addHeader('Access-Control-Allow-Headers', Object.keys(allowedHeaders).join(', '));

          return response;
        });
    }

    return descriptor;
  };
}

class Test {
  [keyof: string]: any;
  // constructor() { }

  // @cors('*')
  // public test(): Promise<HTTPResponse> {
  //   return Promise.resolve(new HTTPResponse());
  // }
  public name: string | undefined;
  public age: number | undefined;

  @redacted
  public created: Date | undefined;


}

const x: Test = new Test();
x.name = 'name';
x.age = 12;
x.created = new Date();


console.log("x", { newX, redactedKeys: getRedactedKeys(x) });