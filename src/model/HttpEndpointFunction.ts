import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { LambdaContext } from "./LambdaContext";

export interface HttpEndpointFunction {
    /**
     * 
     * Intentionally not supporting the callback pattern.
     * @param event the event payload from an HttpApi event.
     * @param context of the invocation.
     */
    (event: HttpRequest, context?: LambdaContext): Promise<HttpResponse>;
}