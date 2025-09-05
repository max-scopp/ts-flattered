import ts from "typescript";
import { tsf } from "../src";
import { cls } from "../src/api/cls";
import { code } from "../src/api/code";
import { ctor } from "../src/api/ctor";
import { method } from "../src/api/method";
import { param } from "../src/api/param";
import { Program } from "../src/api/program";
import { property } from "../src/api/property";

// Create a new program
const program = new Program();

program.addExternalDependencies([
  {
    moduleSpecifier: "@angular/core",
    namedExports: [
      "Component",
      "Injectable",
      "Input",
      "Output",
      "EventEmitter",
      "OnInit",
      "OnDestroy",
      "ViewChild",
      "ElementRef",
    ],
    typeOnlyExports: ["Type", "ComponentRef"],
  },
  {
    moduleSpecifier: "@angular/common",
    namedExports: ["NgIf", "NgFor", "NgClass", "DatePipe", "CommonModule"],
  },
  {
    moduleSpecifier: "@angular/common/http",
    namedExports: [
      "HttpClient",
      "HttpClientModule",
      "HttpHeaders",
      "HttpParams",
    ],
    typeOnlyExports: ["HttpResponse", "HttpErrorResponse"],
  },
  {
    moduleSpecifier: "@angular/router",
    namedExports: ["Router", "ActivatedRoute", "RouterModule"],
    typeOnlyExports: ["Route", "Routes"],
  },
  {
    moduleSpecifier: "@angular/forms",
    namedExports: [
      "FormBuilder",
      "FormGroup",
      "FormControl",
      "Validators",
      "ReactiveFormsModule",
    ],
    typeOnlyExports: ["AbstractControl"],
  },
]);

// Add additional external dependencies for RxJS (commonly used with Angular HTTP)
program.addExternalDependency({
  moduleSpecifier: "rxjs",
  namedExports: ["Observable", "of", "throwError"],
});

program.addExternalDependency({
  moduleSpecifier: "rxjs/operators",
  namedExports: ["catchError", "map", "tap"],
});

// Create Pet interface using code function
const petInterfaceStatements = code(`
export interface Pet {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  photoUrls: string[];
  tags: Array<{
    id: number;
    name: string;
  }>;
  status: 'available' | 'pending' | 'sold';
}

export interface ApiResponse<T> {
  code: number;
  type: string;
  message: string;
  data?: T;
}
`);

// Create the PetStore Service class
const petStoreService = cls({
  name: "PetStoreService",
  isExported: true,
  members: [
    // Add the baseUrl property using the new property API
    property({
      name: "baseUrl",
      type: "string",
      scope: "private",
      isReadonly: true,
      initializer: tsf.createStringLiteral("https://petstore.swagger.io/v2"),
    }),

    // Constructor with HttpClient injection
    ctor({
      parameters: [
        param({
          name: "http",
          type: "HttpClient",
          scope: "private",
        }),
      ],
      body: code("// HttpClient will be injected automatically"),
    }),

    // Get pet by ID method
    method({
      name: "getPetById",
      parameters: [param({ name: "petId", type: "number" })],
      returnType: "Observable<Pet>",
      body: code(`
        const url = \`\${this.baseUrl}/pet/\${petId}\`;
        return this.http.get<Pet>(url).pipe(
          catchError(this.handleError<Pet>('getPetById'))
        );
      `),
    }),

    // Get pets by status method
    method({
      name: "getPetsByStatus",
      parameters: [
        param({
          name: "status",
          type: "'available' | 'pending' | 'sold'",
        }),
      ],
      returnType: "Observable<Pet[]>",
      body: code(`
        const url = \`\${this.baseUrl}/pet/findByStatus\`;
        const params = new HttpParams().set('status', status);
        return this.http.get<Pet[]>(url, { params }).pipe(
          catchError(this.handleError<Pet[]>('getPetsByStatus', []))
        );
      `),
    }),

    // Add new pet method
    method({
      name: "addPet",
      parameters: [param({ name: "pet", type: "Omit<Pet, 'id'>" })],
      returnType: "Observable<Pet>",
      body: code(`
        const url = \`\${this.baseUrl}/pet\`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<Pet>(url, pet, { headers }).pipe(
          catchError(this.handleError<Pet>('addPet'))
        );
      `),
    }),

    // Update pet method
    method({
      name: "updatePet",
      parameters: [param({ name: "pet", type: "Pet" })],
      returnType: "Observable<Pet>",
      body: code(`
        const url = \`\${this.baseUrl}/pet\`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.put<Pet>(url, pet, { headers }).pipe(
          catchError(this.handleError<Pet>('updatePet'))
        );
      `),
    }),

    // Delete pet method
    method({
      name: "deletePet",
      parameters: [param({ name: "petId", type: "number" })],
      returnType: "Observable<ApiResponse<any>>",
      body: code(`
        const url = \`\${this.baseUrl}/pet/\${petId}\`;
        return this.http.delete<ApiResponse<any>>(url).pipe(
          catchError(this.handleError<ApiResponse<any>>('deletePet'))
        );
      `),
    }),

    // Private error handling method
    method({
      name: "handleError",
      scope: "private",
      parameters: [param({ name: "operation", type: "string" })],
      returnType: "any",
      body: code(`
        return (error: any): Observable<any> => {
          console.error(\`\${operation} failed: \${error.message}\`);
          return throwError(() => error);
        };
      `),
    }),
  ],
});

// Create the types file
const typesFile = program.createSourceFile("pet-store.types.ts");
typesFile.addStatement(...petInterfaceStatements);

// Create the service file
const serviceFile = program.createSourceFile("pet-store.service.ts");
serviceFile.addStatement(petStoreService);

// Write to output directory
await program.writeAll("out/angular-petstore-example");
