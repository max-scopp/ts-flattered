import {
  ClassMethodInfo,
  ClassPropertyInfo,
  DecoratorInfo,
  fileFromString,
} from "../src/modules/file";

// Sample TypeScript code with classes and decorators
const codeWithDecorators = `
import { Component, Injectable, Input, Output, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  @Cacheable()
  getUsers() {
    return this.http.get(this.apiUrl);
  }

  @LogMethod('Creating user')
  createUser(@Required() user: UserModel) {
    return this.http.post(this.apiUrl, user);
  }
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  @Input() title: string = 'User List';
  @Output() userSelected = new EventEmitter<UserModel>();

  @Input('userData')
  set users(data: UserModel[]) {
    this._users = data || [];
  }
  private _users: UserModel[] = [];

  @LogEvent('User Selected')
  onSelectUser(user: UserModel) {
    this.userSelected.emit(user);
  }
}

interface UserModel {
  id: number;
  name: string;
  email: string;
}
`;

// Parse the source file
const sourceFile = fileFromString("user-components.ts", codeWithDecorators);

console.log("Analyzing TypeScript file with classes and decorators...\n");

// Find all classes in the file
const classes = sourceFile.findClasses();
console.log(
  `Found ${classes.length} classes: ${classes.map((c) => c.name?.text).join(", ")}\n`,
);

// Process each class
classes.forEach((classDecl) => {
  const className = classDecl.name?.text || "Anonymous";
  console.log(`\n==== Class: ${className} ====`);

  // Get class decorators
  const classDecorators = sourceFile.findDecorators(classDecl);
  console.log(`\nClass Decorators: ${classDecorators.length}`);

  classDecorators.forEach((decorator) => {
    const decoratorInfo = sourceFile.getDecoratorInfo(decorator);
    console.log(`- @${decoratorInfo.name}`);

    if (decoratorInfo.arguments.length > 0) {
      console.log("  Arguments:");
      decoratorInfo.arguments.forEach((arg) => {
        console.log(`  ${JSON.stringify(arg, null, 2)}`);
      });
    }
  });

  // Get class properties
  const properties = sourceFile.getClassProperties(classDecl);
  console.log(`\nProperties: ${properties.length}`);

  properties.forEach((prop) => {
    console.log(
      `- ${prop.isPrivate ? "private " : ""}${prop.isStatic ? "static " : ""}${prop.isReadonly ? "readonly " : ""}${prop.name}${prop.type ? ": " + prop.type : ""}`,
    );

    if (prop.decorators.length > 0) {
      console.log("  Decorators:");
      prop.decorators.forEach((dec) => {
        console.log(
          `  @${dec.name}${dec.arguments.length > 0 ? "(" + JSON.stringify(dec.arguments) + ")" : ""}`,
        );
      });
    }
  });

  // Get class methods
  const methods = sourceFile.getClassMethods(classDecl);
  console.log(`\nMethods: ${methods.length}`);

  methods.forEach((method) => {
    console.log(
      `- ${method.isPrivate ? "private " : ""}${method.isStatic ? "static " : ""}${method.name}(${method.parameters.map((p) => p.name).join(", ")})`,
    );

    if (method.decorators.length > 0) {
      console.log("  Method Decorators:");
      method.decorators.forEach((dec) => {
        console.log(
          `  @${dec.name}${dec.arguments.length > 0 ? "(" + JSON.stringify(dec.arguments) + ")" : ""}`,
        );
      });
    }

    method.parameters.forEach((param) => {
      if (param.decorators.length > 0) {
        console.log(`  Parameter '${param.name}' Decorators:`);
        param.decorators.forEach((dec) => {
          console.log(
            `    @${dec.name}${dec.arguments.length > 0 ? "(" + JSON.stringify(dec.arguments) + ")" : ""}`,
          );
        });
      }
    });
  });

  console.log("\n--------------------------------");
});
