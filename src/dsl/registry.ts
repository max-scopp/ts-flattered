import type { Project } from "ts-morph";
import type { TsFlatteredStatement } from "./file";
import type { TsFlatteredImport } from "./import";

export interface TsFlatteredFile {
  name: string;
  statements: TsFlatteredStatement[];
  registry: Registry;
  externalImports: TsFlatteredImport[];
  render(): string;
  addImport(imp: TsFlatteredImport): void;
}

export interface SymbolRegistration {
  filePath: string;
  importType?: "named" | "default" | "namespace";
  isTypeOnly?: boolean;
}

export class Registry {
  private files: TsFlatteredFile[] = [];
  private symbols: Map<string, SymbolRegistration> = new Map(); // symbolName -> registration info
  public readonly project: Project;

  constructor(project?: Project) {
    this.project = project ?? Registry.createDefaultProject();
  }

  private static createDefaultProject(): Project {
    const {
      Project: TsMorphProject,
      ScriptTarget,
      ModuleKind,
      ModuleResolutionKind,
    } = require("ts-morph");
    return new TsMorphProject({
      compilerOptions: {
        target: ScriptTarget.ESNext,
        module: ModuleKind.NodeNext,
        moduleResolution: ModuleResolutionKind.NodeNext,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
      },
      tsConfigFilePath: "./tsconfig.json",
    });
  }

  push(file: TsFlatteredFile) {
    this.files.push(file);
    // register exported classes automatically
    for (const stmt of file.statements) {
      const exportedSymbols = stmt.getExportedSymbols();
      for (const symbol of exportedSymbols) {
        this.registerSymbol(symbol, `./${file.name.replace(/\.ts$/, "")}`);
      }
    }
  }

  registerSymbol(symbol: string, filePath: string): void;
  registerSymbol(symbol: string, registration: SymbolRegistration): void;
  registerSymbol(
    symbol: string,
    filePath: string,
    options: {
      importType?: "named" | "default" | "namespace";
      isTypeOnly?: boolean;
    },
  ): void;
  registerSymbol(
    symbol: string,
    filePathOrRegistration: string | SymbolRegistration,
    options?: {
      importType?: "named" | "default" | "namespace";
      isTypeOnly?: boolean;
    },
  ): void {
    let registration: SymbolRegistration;

    if (typeof filePathOrRegistration === "string") {
      registration = {
        filePath: filePathOrRegistration,
        importType: options?.importType || "named",
        isTypeOnly: options?.isTypeOnly || false,
      };
    } else {
      registration = filePathOrRegistration;
    }

    this.symbols.set(symbol, registration);
  }

  resolveSymbol(symbol: string): string | undefined {
    const registration = this.symbols.get(symbol);
    return registration?.filePath;
  }

  getSymbolRegistration(symbol: string): SymbolRegistration | undefined {
    return this.symbols.get(symbol);
  }

  getFiles(): TsFlatteredFile[] {
    return this.files;
  }
}

export const registry = new Registry();
