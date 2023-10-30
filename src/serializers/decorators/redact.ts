import { SerializerService } from '../service/SerializerService';

export const KEY: string = 'redacted';

/**
 * An attribute marked as ignored will not be persisted.
 */
export function redact(originalMethod: any, context: ClassFieldDecoratorContext): void {
  context.addInitializer(function (): void {
    const { name } = context;
    const metadata = this.constructor[SerializerService.PREFIX];
    if (metadata) {
      if (!metadata[KEY]) metadata[KEY] = [];
      // TODO may need to add more attributes in the future to allow conditional redaction.
      metadata[KEY].push({ field: name });
    }
  });
}
