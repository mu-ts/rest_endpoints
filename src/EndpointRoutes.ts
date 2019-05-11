import 'reflect-metadata';
import { Logger, ConsoleLogger, LogLevel } from '@mu-ts/logger';
import { EventCondition } from './EventCondition';
import { EndpointRoute } from './EndpointRoute';
import { ObjectFactory } from './ObjectFactory';
import { Validation } from './Validation';

const METADATA_KEY: string = '__mu-ts_endpoints';
const METADATA_VALIDATE_KEY: string = '__mu-ts_validate';


export class EndpointRoutes {
    private static _routes: Array<EndpointRoute> = [];
    private static _validations: Array<Validation> = [];
    private static _instances: Map<string, any> = new Map();
    private static logger: Logger = new ConsoleLogger('EndpointRoutes', LogLevel.info);

    private constructor() {
    }

    /**
     *
     * @param headers to set on every request.
     */
    public static setLogLevel(level: LogLevel): void {
        EndpointRoutes.logger.setLevel(level);
    }

    /**
     *
     */
    public static getRoutes(): Array<EndpointRoute> {
        return EndpointRoutes._routes;
    }

    /**
     *
     * @param condition to execute against array of routes to determine if the route is located.
     */
    public static find(condition: Function): EndpointRoute | undefined {
        EndpointRoutes.logger.debug('find()', condition);
        return EndpointRoutes._routes.find((value: EndpointRoute, index: number) => condition(value, index));
    }

    /**
     *
     * @param target to attach endpoints to.
     */
    public static init(target: any, pathPrefix: string = '', objectFactory?: ObjectFactory): void {
        EndpointRoutes.logger.debug('init()', {pathPrefix, target});
        const validations: Validation[] = Reflect.getMetadata(METADATA_VALIDATE_KEY, <Function>target || []);
        EndpointRoutes._validations = validations;

        const paths: EndpointRoute[] = Reflect.getMetadata(METADATA_KEY, <Function>target) || [];
        paths.forEach((path: EndpointRoute) => {
            path.resource = `${pathPrefix || ''}${path.resource || ''}`;
            if (!path.resource || path.resource.trim() === '') {
                throw Error('Both @endpoints does not contain a prefix and @endpoint does not contain a path.');
            }

            const _instance: any = EndpointRoutes.getInstance(target, objectFactory);

            path.endpoint = path.endpoint.bind(_instance);

            EndpointRoutes.logger.debug('init() path', {path, name: target['name']});

            EndpointRoutes._routes.push(path);
        });
    }

    /**
     *
     * @param _constructor to invoke a new instance of.
     * @param objectFactory to use to create the arguments for the constructor.
     */
    private static getInstance(_constructor: any, objectFactory?: ObjectFactory): any {
        let instance = EndpointRoutes._instances.get(_constructor['name']);
        if (!instance) {
            instance = new _constructor(objectFactory ? objectFactory.get(_constructor.name) : undefined);
            EndpointRoutes._instances.set(_constructor['name'], instance);
        }
        return instance;
    }

    /**
     *
     * @param target class to attach endpoints to.
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
    public static register(
        target: any,
        resource: string | undefined,
        action: string,
        endpoint: Function,
        descriptor: PropertyDescriptor,
        condition?: EventCondition,
        priority?: number
    ): void {
        const routeAction = typeof action === 'string' ? action.toUpperCase() : action;
        const paths: EndpointRoute[] = Reflect.getMetadata(METADATA_KEY, target.constructor) || [];
        paths.push({
            descriptor: descriptor,
            resource: resource,
            action: routeAction,
            endpoint: endpoint,
            condition: condition,
            priority: priority || 0,
        });
        Reflect.defineMetadata(METADATA_KEY, paths, target.constructor);
        EndpointRoutes.logger.debug('register() path', {resource, action, condition, priority});
    }

    public static registerValidation(
        target: any,
        validation: Validation
    ): void {

        const validators: Validation[] = Reflect.getMetadata(METADATA_VALIDATE_KEY, target.constructor) || [];
        validators.push(validation);

        Reflect.defineMetadata(METADATA_VALIDATE_KEY, validators, target.constructor);
    }

    public static getValidators(): Array<Validation> {
        return this._validations;
    }
}