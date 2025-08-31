import { Dog } from "./Dog";
import { Cat } from "./Cat";

export class PetStore {
    createDog(name: string): Dog {
        /* tscb:3 */ 
                const dog = new Dog();
                // Dog.someStaticMethod();
                return dog;
              
    }

    createCat(): Cat {
        /* tscb:4 */ 
                return new Cat();
              
    }

    makeNoise(pet: Dog | Cat): void {
        /* tscb:5 */ 
                if (pet instanceof Dog) {
                  pet.bark();
                } else if (pet instanceof Cat) {
                  pet.meow();
                }
              
    }
}
