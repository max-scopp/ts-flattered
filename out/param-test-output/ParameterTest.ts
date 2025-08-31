export class ParameterTest {
    constructor(private readonly name: string, public age: number, protected email: string, readonly id: string) {
        /* tscb:1 */ 
                // Constructor body
              
    }

    processData(data: any[], options: unknown, ...args: string[]): void {
        /* tscb:2 */ 
                console.log(data, options, args);
              
    }

    combineValues(first: string, second: number, ...others: any[]): string {
        /* tscb:3 */ 
                return [first, second, ...others].join(' ');
              
    }
}
