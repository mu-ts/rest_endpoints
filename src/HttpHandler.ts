import { Router } from './endpoints/services/Router';
import { SerializerService } from './serializers/service/SerializerService';
import { Validator } from './validation/model/Validator';
import { ValidationService } from './validation/service/ValidationService';
import { CORS } from './cors/service/CORS';
import { HttpCORS } from './cors/model/HttpCORS';
import { HttpSerializer } from './serializers/model/HttpSerializer';
import { Headers } from './endpoints/services/Headers';
import { ObjectFactory } from './objects/model/ObjectFactory';
import { BasicObjectFactory } from './objects/service/BasicObjectFactory';
import { Logger } from './utils/Logger';

/**
 * Entrypoint handler for lambda functions accepting http requests.
 */
export class HttpHandler {
  private static _instance: HttpHandler | undefined;

  private validationService?: ValidationService;

  private serializerService?: SerializerService;

  private _objectFactory?: ObjectFactory;

  private _router?: Router;

  private constructor() {
    Logger.trace('HttpHandler() constructed.');
  }

  public static instance(): HttpHandler {
    if (!HttpHandler._instance) {
      Logger.trace('HttpHandler.instance() Creating instance.');
      HttpHandler._instance = new HttpHandler();
    }
    return HttpHandler._instance;
  }

  public objectFactory(objectFactory: ObjectFactory): HttpHandler {
    Logger.trace('HttpHandler.objectFactory()', { clazz: objectFactory.constructor.name });
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
    if (!this._router) {
      if (!this._objectFactory) this._objectFactory = new BasicObjectFactory();
      if (!this.serializerService) this.serializerService = new SerializerService();
      if (!this.validationService) this.validationService = new ValidationService('ajv');
      Logger.trace('HttpHandler.router() Creating instance.', {
        serializer: this.serializerService.constructor.name,
        objectFactory: this._objectFactory.constructor.name,
        validationService: this.validationService.constructor.name,
      });
      if (!this._router) this._router = new Router(this.serializerService, this._objectFactory, this.validationService);
    }
    return this._router;
  }
}