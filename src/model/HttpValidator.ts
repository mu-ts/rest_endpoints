import { HttpRequest } from "./HttpRequest";
import { HttpValidationResponse } from "./HttpValidationResponse";

export interface HttpValidator {
    <T>(schema: object, body: any): T | undefined;
}