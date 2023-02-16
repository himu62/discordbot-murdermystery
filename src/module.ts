import * as fs from "node:fs";
import { Guild } from "discord.js";

export interface IScenario {
  init: (guild: Guild, prefix: string) => Promise<IScenario>;
  get: (guild: Guild, categoryId: string, prefix: string) => Promise<IScenario>;
  scene: (scene: string) => Promise<void>;
}

type Modules = Map<string, IScenario>;

class ModuleClass {
  private static readonly modulesDir = "./modules";
  private static _instance: Modules;

  public static get instance(): Modules {
    if (!this._instance) {
      this._instance = new Map<string, IScenario>();
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
