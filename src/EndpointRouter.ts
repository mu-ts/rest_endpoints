import { HTTPEvent, HTTPResponse, HTTPBody, HTTPHeaders, HTTPAction, Validation } from './Model';
import { Context, Callback } from 'aws-lambda';
import { HTTPSerializer, JSONRedactingSerializer } from './serialization';
import { HTTPEventCondition, endpoint, cors, AllowedOrigin } from './decorators';

interface EndpointRoute {
    resource: string;
    action: string;
    endpoint: Function;
    condition?: HTTPEventCondition;
    priority: number;
    validations?: Array<Validation>;
    descriptor: PropertyDescriptor;
}

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {

    private static routes: Array<EndpointRoute> = [];
    private static serializer: HTTPSerializer = new JSONRedactingSerializer();
    public static validationHandler: any;

    private constructor() {
    }

    /**
     *
     * @param resource to map this endpoint to.
     * @param action to map this endpoint to.
     * @param endpoint function that will take event: HTTPEvent as the first argument
     *        and context: LambdaContext as the second argument. It is expected that
     *        it will return Promise<HTTPResponse>
     * @param descriptor the property descriptor from the method, used to bind the
     *        validation back to the endpoint in the handle() phase
     * @param condition?, that if provided, will test if this endpoint should even
     *        be invoked.
     * @param priority? of this endpoint. A higher value indicates it should be
     *        executed ahead of other endpoints. Defaults to 0.
     *
     */
    public static register(resource: string, action: string, endpoint: Function, descriptor: PropertyDescriptor, condition?: HTTPEventCondition, priority?: number): void {
        EndpointRouter.routes.push({
            descriptor: descriptor,
            resource: resource,
            action: action,
            endpoint: endpoint,
            condition: condition,
            priority: priority || 0
        });
    }

    public static attachEndpointValidation(descriptor: PropertyDescriptor, validation: Validation): void {
        const route = EndpointRouter.routes.find(route => route.descriptor === descriptor);
        if (route) {
            if (route.validations) {
                route.validations.push(validation);
            } else {
                route.validations = [validation];
            }
        }
    }

    /**
     *
     * @param headers to set on every request.
     */
    public static setDefaultHeaders(headers: HTTPHeaders): void {
        HTTPResponse.setDefaultHeaders(headers);
    }

    /**
     *
     * @param event to invoke the endpoint with.
     * @param context of the invocation.
     * @param callback to execute when completed.
     */
    public static handle(event: HTTPEvent, context: Context, callback: Callback<HTTPResponse>): void {
        const body: HTTPBody | undefined = event.body ? EndpointRouter.serializer.deserializeBody(event.body) : undefined;
        console.log('EndpointRouter.routes', {resource: event.resource, httpMethod: event.httpMethod});
        const routeOptions: Array<EndpointRoute> = EndpointRouter.routes
            .filter((route: EndpointRoute) => route.resource === event.resource)
            .filter((route: EndpointRoute) => route.action === event.httpMethod)
            .filter((route: EndpointRoute) => {
                console.log('check condition', route);
                if (route.condition) {
                    return route.condition(body, event);
                }
                return route;
            })
            .map((route: EndpointRoute) => {
                if (route.validations) {
                    route.validations = route.validations.filter((validation) => validation.validatorCondition && validation.validatorCondition(body, event));
                } else {
                    route.validations = [];
                }
                return route;

            })
            .sort((first: EndpointRoute, second: EndpointRoute) => second.priority - first.priority);

        if (!routeOptions || routeOptions.length === 0) {
            return callback(
                undefined,
                HTTPResponse
                    .setBody({message: 'Action is not implemented at this path.'})
                    .setStatusCode(501)
                    .addHeader('X-REQUEST-ID', event.requestContext.requestId)
            );
        }

        let promiseChain = Promise.resolve<HTTPResponse | undefined>(undefined);

        for (const route of routeOptions) {
            promiseChain = promiseChain.then((response: HTTPResponse | undefined) => {
                if (response) return response;
                return route.endpoint(event, context, route.validations);
            });
        }


        promiseChain
            .then((response: HTTPResponse | undefined) => callback(undefined, response))
            .catch((error: any) => callback(error));

    }

    static attachValidationHandler(validationHandler: any) {
        EndpointRouter.validationHandler = validationHandler;
    }
}