import { HttpRequest } from './HttpRequest';
import { HttpResponse } from './HttpResponse';
import { LambdaContext } from './LambdaContext';

export type HttpEndpointFunction = <T>(event: HttpRequest<T>, context?: LambdaContext) => Promise<HttpResponse>;
