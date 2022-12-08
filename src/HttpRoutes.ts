import { Router } from "./endpoints/services/Router";
import { SerializerService } from "./serializers/service/SerializerService";
import { Validator } from "./validation/model/Validator";
import { ValidationService } from "./validation/service/ValidationService";

export class HttpRoutes {
    private static _instance: HttpRoutes | undefined;

    private validationService: ValidationService;

    private serializerService: SerializerService;

    private routes: Router;

    private constructor() {
        this.routes = new Router();
    }

    public static instance(): HttpRoutes{
        if (HttpRoutes._instance) return HttpRoutes._instance;
        HttpRoutes._instance = new HttpRoutes();
        return HttpRoutes._instance;
    }

    /**
     * 
     * @param validator to verify payloads with. 
     * @returns 
     */
    public validation(validator?: string | Validator<any>): ValidationService {
        if(validator) {
            this.validationService = new ValidationService(validator);
        }
        return this.validationService;
    }

    /**
     * application/json is supporte by default.
     * @param serializers and their associated content type.
     */
    public serializer(serializers: {[key:string]: HttpSerializer}): HttpRoutes {
        this.routes.configure({ serializers });
        return this;
    }

    /**
     * @param cors defaults.
     * @returns 
     */
    public cors(cors: HttpCORS): HttpRoutes{
        this.routes.configure({ cors });
        return this;
    }

    public router() {
        return this.routes;
    }
}