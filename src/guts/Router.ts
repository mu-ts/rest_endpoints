import { HttpCORS } from "../model/HttpCORS";
import { HttpResponse } from "../model/HttpResponse";
import { HttpRoute } from "../model/HttpRoute";
import { HttpSerializer } from "../model/HttpSerializer";
import { HttpValidator } from "../model/HttpValidator";
import { LambdaContext } from "../model/LambdaContext";
import { JSONSerializer } from "./JSONSerializer";
import { URLEncodedSerializer } from "./URLEncodedSerializer";

export class Router {
    private cors?: HttpCORS; 
    private serializers: {[key:string]: HttpSerializer};
    private validation?: string | HttpValidator;
    private readonly routes: { [key:string]: HttpRoute };

    constructor() {
        this.routes = {};
    }

    /**
     * 
     * @param options to overwrite defaults with.
     */
    public configure(options: { cors?: HttpCORS, serializers?: {[key:string]: HttpSerializer}, validation?: string | HttpValidator }) {
        if(options.cors) this.cors = options.cors;
        this.serializers = {
            'application/json': new JSONSerializer(),
            'application/x-www-form-urlencoded': new URLEncodedSerializer(),
        }
        if(options.serializers) this.serializers = { ...this.serializers, ...options.serializers };
        if(options.validation) this.validation = options.validation;
    }

    /**
     * 
     * @param route to register with this router.
     * @returns 
     */
     public register(route: HttpRoute): Router {
        /**
         * Validate
         */
        const path: string = `${route.path}:${route.action}`;
        this.routes[path] = route;
        return this;
    }

    public handle(event: any, context?: LambdaContext): Promise<HttpResponse> {

        let path, action;

        /**
         * TODO normalize the event so it can be processed, for both version 1 or 2.
         * 
         * For payload references
         * 
         * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
         */
        if (event.version === "2.0") {
            const { requestContext  } = event;
            const { http } = requestContext;

            path = http.rawPath;
            action = http.method;

        } else {
            path = event.resource;
            action = event.httpMethod;
        }

        const route: HttpRoute | undefined = this.routes[`${path}:${action}`];
        const response: HttpResponse = {};

        /**
         * If no route is found, then return a 501.
         */
        if (!route) {
            response.body = { message: `The path or action is not implemented "${path}:${action}".`};
            response.statusCode = 501;
            response.statusDescription = `The path or action is not implemented "${path}:${action}".`;
            response.headers = this.responseHeaders();

        } else {
            // TODO get body, headers, path parameters, query string and cookies from event.
            // TODO execute route
            // TODO validation
            // TODO cors.
            // TODO serialization use AJV if present, and if output schema is present.
            //      https://ajv.js.org/api.html#ajv-compileserializer-schema-object-data-any-string

            /**
             * GetMemories
             *   POST
             * getmemories.post.validation.json --> for validation
             * getmemories.post.output.json --> for response
             */
        }

        // TODO should there be a best effort to match the body with a serializer?
        // TODO fallback on content-type
        const accept: string = 'application/json';
        const serializer: HttpSerializer | undefined = this.serializers[accept];
    
        if (serializer?.response && response.body) response.body = serializer.response(response.body);
           
        return Promise.resolve({} as HttpResponse);
    }

    private responseHeaders(): {[key:string]: string} {
        const headers: {[key:string]: string} = {
            'Content-Type': 'application/json',
        };

        // 'Content-Length': undefined
        // TODO pagination headers?
        // TODO how to know if route has cors or not?

        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
         */
        if (this.cors) {
            const { allowOrigin, vary, exposeHeaders, maxAge, allowCredentials, allowHeaders, allowedMethods, requestMethod } = this.cors;
            if (allowOrigin) {
                headers['Access-Control-Allow-Origin'] = allowOrigin;
                if(vary) headers['Vary'] = vary;
            }
            if (exposeHeaders) headers['Access-Control-Expose-Headers'] = exposeHeaders.join(', ');
            if (allowedMethods) headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
            if (allowHeaders) headers['Access-Control-Allow-Headers'] = allowHeaders.join(', ');
            if (requestMethod) headers['Access-Control-Request-Method'] = requestMethod;
            if (allowCredentials) headers['Access-Control-Allow-Credentials'] = `${allowCredentials}`;
            if (maxAge) headers['Access-Control-Max-Age'] = `${maxAge}`;
        }

        return headers;
    }
}