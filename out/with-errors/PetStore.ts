import { Dog } from "./Dog";

export class PetStore {
    getDogs(opt1: Dog[]): void {
        /* tscb:4 */ for (const dog of opt1) dog.bark();
    }
}
