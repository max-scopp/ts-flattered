export class Dog {
    bark(): void {
        /* tscb:1 */ console.log("Woof!");
    }

    getName(): string {
        /* tscb:2 */ return this.name;
    }

    setName(name: string): void {
        /* tscb:3 */ this.name = name;
    }
}
