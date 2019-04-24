export interface ObjectFactory {
  get(target: string): Array<any> | undefined;
}
