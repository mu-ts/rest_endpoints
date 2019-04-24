import { EventCondition } from './EventCondition';
import { EndpointRoute } from './EndpointRoute';

const METADATA_KEY: string = '__mu-ts_endpoints';

export class EndpointRoutes {
  private static _routes: Array<EndpointRoute> = [];

  private constructor() {}

  /**
   *
   */
  public static getRoutes(): Array<EndpointRoute> {
    return EndpointRoutes._routes;
  }

  public static find(condition: Function): EndpointRoute | undefined {
    return EndpointRoutes._routes.find((value: EndpointRoute, index: number) => condition(value, index));
  }

  /**
   *
   * @param target to attach endpoints to.
   */
  public static init(target: any, pathPrefix: string = ''): void {
    const paths: EndpointRoute[] = Reflect.getMetadata(METADATA_KEY, target.constructor) || [];
    paths.forEach((path: EndpointRoute) => {
      path.resource = `${pathPrefix}${path.resource}`;
      if (!path.resource || path.resource.trim() === '') {
        throw Error('Both @endpoints does not contain a prefix and @endpoint does not contain a path.');
      }
      path.endpoint = path.endpoint.bind(target);
      EndpointRoutes._routes.push(path);
    });
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
  }
}
