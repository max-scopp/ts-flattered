import { Dog } from "./Dog";
import { Signale } from "signale";

export class PetStore {
    getDogs(opt1: Dog[]): void {
        /* tscb:4 */ 
                for (const dog of opt1) {
                  dog.bark();
                  new Signale().fav("Dog " + dog.getName() + " barked");
                }
              
    }
}
