import { HttpAction } from './HttpAction';
import { HttpEndpointFunction } from './HttpEndpointFunction';

/**
 * Represents a single HTTP route along with all the
 * mapped functions.
 */
export interface HttpRoute {
    action: HttpAction;
    path: string;
    function: HttpEndpointFunction;
    instance: object;
    serialize?: object;
    deserialize?: object;
    validation?: object;
}