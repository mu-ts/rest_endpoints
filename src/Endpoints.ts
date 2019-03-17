import { EndpointRouter } from './Routes';
import { EndpointResponse, EndpointEvent } from './Model';

/**
 * 
 * @param route for this function.
 */
export function endpoint(route:string, cors:boolean = true, roles:Array<string> = []) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    /**
     * Only needs to be initialized once. After that the decorator no longer needs to participate in the execution of
     * the function.
     */
    if(!EndpointRouter.exists(route)) {

      console.log("init");

      function wrapedFunction():Promise<EndpointResponse> {

        const event:EndpointEvent = arguments[0]; //TODO get role

        // const role                      = event.
        //TODO if role not in roles, then return 403

        return descriptor.value.apply(this, arguments)
          .then( (response:EndpointResponse) => {

            if(!response.headers) response.headers = {};

            // response.headers['X-Frame-Options'] = 'DENY'; Should be deteremined from JWT payload.            
            // if(!response.headers['Cache-Control']) response.headers['Cache-Control'] = 30; //TODO pull from config
            if(!response.headers['X-REQUEST-ID']) response.headers['X-REQUEST-ID']  = event.requestContext.requestId;

            /*
              * Never cache 404 responses.
              */
            if(response.statusCode===404){
              response.headers['Cache-Control'] = 'no-cache';
            }

            if(cors) {
              const path = route.substring(0,route.indexOf(':'));

              //TODO Get ORIGIN from JWT payload.
              response.setCORS(
                '*',
                EndpointRouter.getActions(path).join(', '),
                true,
                Object.keys(response.headers).join(', ')
              );
            }
              
            return response;
          })
          .catch( (error) => {
            console.log("error",error);
            const response:EndpointResponse = new EndpointResponse(
              500,
              { message:error.message },
              { 'X-REQUEST-ID': event.requestContext.requestId }
            );
            response.setCORS('*','*',true);
            return response;
          });
      };

      EndpointRouter.register(route,wrapedFunction);
    }
  };
}
