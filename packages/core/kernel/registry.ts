import type { Module } from "./module";

export interface Registry {
  register: (module: Module) => void;
  getModule: (id: string) => Module | undefined;
  listModules: () => Module[];
}

export function createRegistry(): Registry {
  const modules = new Map<string, Module>();

  return {
    register(module) {
      if (modules.has(module.id)) {
        throw new Error(`Module "${module.id}" is already registered`);
      }
      modules.set(module.id, module);
    },
    getModule(id) {
      return modules.get(id);
    },
    listModules() {
      return [...modules.values()];
    },
  };
}
