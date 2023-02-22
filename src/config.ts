import * as fs from "node:fs";
import * as path from "node:path";

interface Config {
  token: string;
  clientId: string;
  guildId: string;
  gmUserId: string;
}

class ConfigClass {
  private static _instance: Config;

  public static get instance(): Config {
    if (!this._instance) {
      const env = process.env.NODE_ENV;
      console.log("NODE_ENV:", env);
      if (env !== undefined && fs.existsSync(path.join(__dirname, `../config.${env}.json`))) {
        this._instance = JSON.parse(
          fs.readFileSync(path.join(__dirname, `../config.${env}.json`)).toString()
        ) as Config;
      } else {
        this._instance = JSON.parse(
          fs.readFileSync(path.join(__dirname, `../config.json`)).toString()
        ) as Config;
      }
    }
    return this._instance;
  }
}

export const config = ConfigClass.instance;
