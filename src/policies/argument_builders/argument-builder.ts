export abstract class ArgumentBuilder {
  abstract build(): Promise<string[]>;
}
