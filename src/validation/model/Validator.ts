import { HttpRequest } from "../../endpoints/model/HttpRequest";
import { HttpResponse } from "../../endpoints/model/HttpResponse";

export interface Validator<T> {
  validate(request: HttpRequest<object>, schema: object): T[] | undefined;
  format?(errors: T[], request: HttpRequest<object>): HttpResponse;
}