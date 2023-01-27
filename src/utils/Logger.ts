export abstract class Logger {
  private constructor() {}

  public static trace(...args: any[]): void {
    if (this.isLevel(0)) console.trace(args);
  }

  public static debug(...args: any[]): void {
    if (this.isLevel(1)) console.debug(args);
  }

  public static info(...args: any[]): void {
    if (this.isLevel(3)) console.log(args);
  }

  public static warn(...args: any[]): void {
    if (this.isLevel(5)) console.warn(args);
  }

  public static error(...args: any[]): void {
    if (this.isLevel(8)) console.error(args);
  }

  public static fatal(...args: any[]): void {
    if (this.isLevel(10)) console.error(args);
  }

  private static nameToLevel(name?: string): number {
    switch (name) {
      case 'TRACE': return 0;
      case 'DEBUG': return 1;
      case 'INFO': return 3;
      case 'WARN': return 5;
      case 'ERROR': return 8;
      case 'FATAL': return 10;
      default: return 3;
    }
  }

  private static isLevel(level: number): boolean {
    /**
     * For smarter handling will want to use @mu-ts/logging
     */
    const currentLevel: number = this.nameToLevel(process.env.LOG_LEVEL);
    return level >= currentLevel;
  }
}