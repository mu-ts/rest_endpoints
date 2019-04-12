# Summary

Simple REST endpoint and action routing.

## Setup

Your handler or entrypoint file and function should look something similar to what is outlined below. First, any customizations of the `EndpointRouter`. Then, you create an instance of the classes containing your `@endpoint` mappings, and their dependencies, as appropriate. Lastly, you expose `EndpointRouter.handle` as the entrypoint so it can take ownership over properly routing your requests.

We recommend you use a .rest postfix on your export in case you want to handle different event trigger types for this lambda function. For example, if you wanted to also listen to an SNS topic you would create another exported fucntion module.export.sns and wouldnt have to worry about remapping module.export.rest.

```
import { EndpointRouter } from '@mu-ts/endpoints';

/**
 * To modify how the event will be serialized, you can specify your own
 * implementation of the `EventSerailizer`.
 */
EndpointRouter.serializer = new CustomSerializer();

/**
 * Define the default headers for each response.
 */
EndpointRouter.setDefaultHeaders({
  'Server': 'Super awesome',
  'X-Powered-By': 'Super awesome',
  'Set-Cookie': 'Secure',
  'X-Frame-Options': 'DENY',
  'Content-Type': 'application/json',
  'Cache-Control': 'max-age=86400'
});

const usersService: UsersService = new UsersService();
/**
 * Once an instance is created it registers its endpoints with 
 * the EndpointRouter. Only do it once.
 */
    new GetUsersEndpoint(usersService);

module.export.rest = EndpointRouter.handle;
```

## Request Routing

For each function that will be handling a specific 'route' you will need to use the `@endpoint()` decorator. At minimum you must provide the resource and action. The resource is the non unique url pattern, such as `/users/{user-id}` not the unique value which might be `/users/1234`. The action should is the HTTPAction or string action (upper case).

Conditions allow you to specify limitations for when a specific piece of logic will be invoked. It takes a function with the signature `(body: HTTPBody | undefined, event: HTTPEvent): boolean;`. This means you can do quick logic checks on the body or event to determine if the 'current' state eliminates or includes this endpoint from being invoked. 

Priority allows you to determine the order of execution for your endpoints. A higher value grants it higher priority in the sort order, placing it first in the list for execution.

If multiple endpoints qualify, the first endpoint that returns a value will terminate the execution for other endpoints.

Examples:

```
import { endpoint, EndpointResponse, EndpointEvent } from '@authvia/endpoints';

public class GetUsersEndpoint {

  constructor(usersService: UsersService){
    this.usersService = usersService;
  }
  
  @endpoint('/users/{user-id}','PATCH')
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse.body('the-body');
  }
  
  /**
   * Only call this function for the /users/{user-id} POST operation if the body
   * contains an attribute action with the value 'promote'.
   *
   * This could be more complex, and 
   */
  @endpoint('/users/{user-id}',HTTPAction.POST, (body:HTTPBody) => body['action'] === 'promote' || false, 50)
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse
      .body('the-body');
  }
  
  /**
   * This function will be the 'default'. So if the body does not contain an attribute
   * called action, with the value 'promote' then this function will be exeecuted.
   */
  @endpoint('/users/{user-id}',HTTPAction.POST)
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse.body('the-body');
  }
}

```

## CORS

For any endpoint you can modify the CORS values that will be returned for a specific request.

Note: This must be done in concert with the `cors:true` within the serverless.yaml file that enables the OPTIONS response in API Gateways.

Example:

```

import { Response } from './endpoints';
import Response as EndpointResponse from './.endpoints';

@endpoint('/users','GET')
@cors(allowedOrigin,allowedActions,allowedHeaders,allowCredentials)
handle(event: HTTPEvent, context: Context):Promise<HTTPResponse> {

  if(hasError){
   return HTTPResponse
     .status(400)
     .body({message: 'I\'m verbose!'},Error);
  }

  if(updated) {
    return HTTPResponse
      .body(user,User)
      .addHeader('eTag',user.eTag);
  }

  return HTTPResponse
    .status(201)
    .body(user,User)
    .addHeader('eTag',user.eTag);
  
}

```


## Redaction

You can mark attributes to be removed from the response when they are being serialized via the @redacted decorator.

```
public class User {
  private id: string;
  private name: string;
  @redacted
  private role: string; //Will not be returned when serialized.
  private createdBy: string;  
}
```