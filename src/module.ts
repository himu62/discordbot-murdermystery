import * as fs from "node:fs";
import { Guild } from "discord.js";

interface Scenario {
  init: (guild: Guild, prefix: string) => Promise<Scenario>;
  get: (guild: Guild, categoryId: string, prefix: string) => Promise<Scenario>;
  scene: (scene: string) => void;
}

type Modules = Map<string, Scenario>;

class ModuleClass {
  private static readonly modulesDir = "./modules";
  private static _instance: Modules;

  public static get instance(): Modules {
    if (!this._instance) {
      this._instance = new Map<string, Scenario>();
      fs.readdirSync(this.modulesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .forEach((dirent) => {
          import(`.${this.modulesDir}/${dirent.name}`)
            .then((m) => {
              this._instance.set(dirent.name, m.Scenario);
            })
            .catch((err) => {
              console.error(
                `module "${dirent.name}" の読み込みに失敗しました`,
                err
              );
            });
        });
    }
    return this._instance;
  }
}

export const modules = ModuleClass.instance;
