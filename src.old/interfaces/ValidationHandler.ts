import { EndpointEvent } from "../model";

export interface ValidationHandler {

    validate<T>(data: any, schema: any): Array<T> | void;
    format<T, B>(errors: T[], event: EndpointEvent<B>): string | object;
}
