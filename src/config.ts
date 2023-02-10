import * as fs from "node:fs";

interface Config {
    token: string;
}


class ConfigClass {
    private static readonly sourcePath = "./config.json";
    private static _instance: Config;

    public static get instance(): Config {
        if (!this._instance) {
            this._instance = JSON.parse(fs.readFileSync(this.sourcePath).toString()) as Config;
        }
        return this._instance;
    }
}

export const config = ConfigClass.instance;
