import { Router } from './endpoints/services/Router';
import { SerializerService } from './serializers/service/SerializerService';
import { Validator } from './validation/model/Validator';
import { ValidationService } from './validation/service/ValidationService';
import { CORS } from './cors/service/CORS';
import { HttpCORS } from './cors/model/HttpCORS';
import { HttpSerializer } from './serializers/model/HttpSerializer';
import { Headers } from './endpoints/services/Headers';
import { ObjectFactory } from 'objects/model/ObjectFactory';
import { BasicObjectFactory } from 'objects/service/BasicObjectFactory';
import { Constructable } from 'objects/model/Constructable';

/**
 * Entrypoint handler for lambda functions accepting http requests.
 */
export class HttpHandler {
  private static _instance: HttpHandler | undefined;

  private validationService?: ValidationService;

  private serializerService?: SerializerService;

  private _objectFactory?: ObjectFactory;

  private routes?: Router;

  private constructor() {}

  public static instance(): HttpHandler {
    if (HttpHandler._instance) return HttpHandler._instance;
    HttpHandler._instance = new HttpHandler();
    return HttpHandler._instance;
  }

  /**
   * @param constructable class.
   * @returns 
   */
  public construct<T>(constructable: Constructable<T>): T {
    return this._objectFactory?.instantiate(constructable);
  }

  public objectFactory(objectFactory: ObjectFactory): HttpHandler {
    this._objectFactory = objectFactory;
    return this;
  }

  /**
   *
   * @param validator to verify payloads with.
   * @returns
   */
  public validation(validator: string | Validator<any>): HttpHandler {
    this.validationService = new ValidationService(validator);
    return this;
  }

  /**
   * application/json is supported by default.
   * @param serializers and their associated content type.
   */
  public serializer(serializer: HttpSerializer): HttpHandler {
    if (!this.serializerService) this.serializerService = new SerializerService();
    this.serializerService.register( serializer);
    return this;
  }

  /**
   * @param cors defaults.
   * @returns
   */
  public cors(cors: HttpCORS): HttpHandler {
    CORS.configure(cors);
    return this;
  }

  /**
   * @param headers to set as defaults.
   * @returns
   */
  public headers(headers: {[key: string]: string}): HttpHandler {
    Headers.default(headers);
    return this;
  }

  public router(): Router {
    if( !this.routes) {
      if (!this._objectFactory) this._objectFactory = new BasicObjectFactory();
      if (!this.serializerService) this.serializerService = new SerializerService();
      if (!this.validationService) this.validationService = new ValidationService('ajv');
      if (!this.routes) this.routes = new Router(this.serializerService, this.validationService);
    }
    return this.routes;
  }
}