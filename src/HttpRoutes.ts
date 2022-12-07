import { Router } from "./guts/Router";
import { HttpSerializer } from "./model/HttpSerializer";
import { HttpValidator } from "./model/HttpValidator";
import { HttpCORS } from "./model/HttpCORS";

export class HttpRoutes {
    private static _instance: HttpRoutes | undefined;

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
    public validator(validator: string | HttpValidator): HttpRoutes {
        this.routes.configure({ validation: validator });
        return this;
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