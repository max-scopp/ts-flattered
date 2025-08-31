export interface TsFlatteredDecorator {
  name: string;
  arguments?: string[];
}

export function decorator(name: string, args?: string[]): TsFlatteredDecorator {
  return { name, arguments: args };
}
