import * as fs from "node:fs";

interface Config {
  token: string;
  clientId: string;
  guildId: string;
}

class ConfigClass {
  private static _instance: Config;

  public static get instance(): Config {
    if (!this._instance) {
      const env = process.env.NODE_ENV;
      if (env !== undefined && fs.existsSync(`./config.${env}.json`)) {
        this._instance = JSON.parse(
          fs.readFileSync(`./config.${env}.json`).toString()
        ) as Config;
      } else {
        this._instance = JSON.parse(
          fs.readFileSync("./config.json").toString()
        ) as Config;
      }
    }
    return this._instance;
  }
}

export const config = ConfigClass.instance;
