export * from './HttpRoutes';

/**
 * @validation(json('./create.x.validation.json))
 * @output(json('./create.x.output.json'))
 * @cors()
 * @get('/v3/users')
 * public create(request: HttpRequest): Promise<HttpResponse>;
 */