import { Router } from "./endpoints/services/Router";
import { SerializerService } from "./serializers/service/SerializerService";
import { Validator } from "./validation/model/Validator";
import { ValidationService } from "./validation/service/ValidationService";
import { CORS } from "./cors/service/CORS";
import { HttpCORS } from "./cors/model/HttpCORS";
import { HttpSerializer } from "./serializers/model/HttpSerializer";
import { Headers } from "./endpoints/services/Headers";

/**
 * Entrypoint handler for lambda functions accepting http requests.
 */
export class HttpRoutes {
  private static _instance: HttpRoutes | undefined;

  private readonly routes: Router;

  private validationService?: ValidationService;

  private constructor(
    private readonly serializerService: SerializerService
  ) {
    this.routes = new Router(serializerService);
  }

  public static instance(): HttpRoutes {
    if (HttpRoutes._instance) return HttpRoutes._instance;
    HttpRoutes._instance = new HttpRoutes(new SerializerService());
    return HttpRoutes._instance;
  }

  /**
   * 
   * @param validator to verify payloads with. 
   * @returns 
   */
  public validation(validator?: string | Validator<any>): ValidationService | undefined {
    if (validator) {
      this.validationService = new ValidationService(validator);
    }
    return this.validationService;
  }

  /**
   * application/json is supporte by default.
   * @param serializers and their associated content type.
   */
  public serializer(mimeType: string, serializer: HttpSerializer): HttpRoutes {
    HttpRoutes._instance!.serializerService.register(mimeType, serializer);
    return this;
  }

  /**
   * @param cors defaults.
   * @returns 
   */
  public cors(cors: HttpCORS): HttpRoutes {
    CORS.configure(cors);
    return this;
  }

  /**
   * @param headers to set as defaults.
   * @returns 
   */
  public headers(headers: {[key:string]: string}): HttpRoutes {
    Headers.default(headers);
    return this;
  }

  public router() {
    return this.routes;
  }
}