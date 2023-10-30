import { Constructable } from '../../objects/model/Constructable';
import { HttpAction } from './HttpAction';
import { HttpEndpointFunction } from './HttpEndpointFunction';

/**
 * Represents a single HTTP route along with all the
 * mapped functions.
 */
export interface HttpRoute {
    action: HttpAction;
    path: string;
    functionName: string;
    function: HttpEndpointFunction;
    clazz: Constructable<unknown>;
    serialize?: object;
    deserialize?: object;
    validation?: object;
}
