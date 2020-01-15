export interface ValidationHandler {

    validate(data: any, schema: any): Array<string> | void;

}
