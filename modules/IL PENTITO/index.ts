import {CategoryChannel, Guild, Role, TextChannel, VoiceChannel,} from "discord.js";
import {AScenario} from "../../src/module";
import {FILE, sendInfoToIndividualChannel} from "../../src/util";
import {readFileSync} from "node:fs";
import {config} from "../../src/config";

const file = FILE(__dirname);

const scenarioName = "IL PENTITO";
const shortName = "ILPENTITO";
const characterNames = ["HO1", "HO2", "HO3", "HO4", "HO5", "HO6"];
const voiceChannelNames = ["全体会議", "密談1", "密談2", "密談3"];
const scenes = ["事前", "ルール", "HO配布", "プロローグ1", "プロローグ2", "投票", "開票n6", "開票6", "今後のファミリー", "解説"];

export class Scenario extends AScenario {
  constructor(
    guild: Guild,
    category: CategoryChannel,
    roles: Map<string, Role>,
    textChannels: Map<string, TextChannel>,
    voiceChannels: Map<string, VoiceChannel>
  ) {
    super({
      scenarioName,
      shortName,
      characterNames,
      voiceChannelNames,
      scenes,
      guild,
      category,
      roles,
      textChannels,
      voiceChannels,
    });
  }

  static async init(guild: Guild, prefix: string): Promise<Scenario> {
    const {
      category,
      roles,
      textChannels,
      voiceChannels,
      audienceRole,
      playersRole,
    } = await super._init(guild, {
      scenarioName,
      shortName,
      characterNames,
      voiceChannelNames,
      scenes,
      prefix,
    });

    return new Scenario(guild, category, roles, textChannels, voiceChannels);
  }

  static async get(
    guild: Guild,
    categoryId: string,
    prefix: string
  ): Promise<Scenario> {
    return super._get<Scenario>(Scenario, {
      guild,
      categoryId,
      prefix,
      scenarioName,
      shortName,
      characterNames,
      scenes,
      textChannelNames: ["連絡・雑談", "共通情報", "観戦", "gm管理"],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const audienceRole = await this.getRole("観戦");
    const playersRole = await this.getRole("PL");
    const cc = await this.getTextChannel("共通情報");

    if (_scene === "事前") {
      const txt = readFileSync(file("共通情報.txt")).toString();
      await cc.send(txt);

      const chCharacters = await Promise.all(
        characterNames.map(async (chara) => {
          return this.getTextChannel(chara);
        })
      );
      await sendInfoToIndividualChannel(chCharacters);

      const gc = await this.getTextChannel("gm管理");
      await gc.send("・事前\n" +
        "・案内（日時、キャラ名考えて）\n" +
        "・共通情報、キャラ決め\n" +
        "・盤面オープン\n" +
        "・ルール説明\n" +
        "・HO配布、血の掟オープン、読み込み10分、点数決め、名前決め？（＋個別質問タイム）\n" +
        "・導入\n" +
        "・順番決め、探索\n" +
        "・会議10m、密談5m\n" +
        "・休憩\n" +
        "・順番決め、探索\n" +
        "・密談5m、会議15m\n" +
        "・推理1.5m（質疑応答は別途）\n" +
        "・投票5m\n" +
        "・エンディング"
      );
      await gc.send("@PL 1/1 11:00開始です。よろしくお願いします。\n\n" +
        "このゲームでは、キャラクターの名前が決まっていません。プレイヤーそれぞれに自分のキャラクターの名前を考えてもらい、ゲーム中はそれを使用します。\n" +
        "キャラクターは全員シチリアマフィアの幹部で男性という設定です。イタリア人の名前だとそれらしいでしょう。フルネームである必要はありません。")
    } else if (_scene === "ルール") {
      const txt = readFileSync(file("ルール.txt")).toString().split("@");
      for (const t of txt) {
        await cc.send(t);
      }
    } else if (_scene === "HO配布") {
      const c1 = await this.getTextChannel("HO1");
      const c2 = await this.getTextChannel("HO2");
      const c3 = await this.getTextChannel("HO3");
      const c4 = await this.getTextChannel("HO4");
      const c5 = await this.getTextChannel("HO5");
      const c6 = await this.getTextChannel("HO6");

      await c1.send({files: [file("HO1.pdf")]});
      await c2.send({files: [file("HO2.pdf")]});
      await c3.send({files: [file("HO3.pdf")]});
      await c4.send({files: [file("HO4.pdf")]});
      await c5.send({files: [file("HO5.pdf")]});
      await c6.send({files: [file("HO6.pdf")]});

      await Promise.all([c1, c2, c3, c4, c5, c6].map(async (c) => {
        return c.send("=====================================================================\n" +
          "ハンドアウトの「あなたの目的」にある優先順位を決めて、" + `<@${config.gmUserId}>` + "をつけて教えてください。\n" +
          "=====================================================================");
      }));
    } else if (_scene === "プロローグ1") {
      const name1 = readFileSync(file("name_ho1.txt")).toString().trim();
      const txt = readFileSync(file("プロローグ1.txt")).toString().replace(/(\[HO1])/g, name1);
      await cc.send(txt);
    } else if (_scene === "プロローグ2") {
      const txt = readFileSync(file("プロローグ2.txt")).toString();
      await cc.send(txt);
    } else if (_scene === "投票") {
      const c1 = await this.getTextChannel("HO1");
      const c2 = await this.getTextChannel("HO2");
      const c3 = await this.getTextChannel("HO3");
      const c4 = await this.getTextChannel("HO4");
      const c5 = await this.getTextChannel("HO5");
      const c6 = await this.getTextChannel("HO6");

      const txt1 = readFileSync(file("投票1.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);
      const txt2 = readFileSync(file("投票2.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);
      const txt3 = readFileSync(file("投票3.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);
      const txt4 = readFileSync(file("投票4.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);
      const txt5 = readFileSync(file("投票5.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);
      const txt6 = readFileSync(file("投票6.txt")).toString().replace("@GM", `<@${config.gmUserId}>`);

      await c1.send(txt1);
      await c2.send(txt2);
      await c3.send(txt3);
      await c4.send(txt4);
      await c5.send(txt5);
      await c6.send(txt6);
    } else if (_scene === "開票n6") {
      const nameHannin = readFileSync(file("name_hannin.txt")).toString().trim();
      const txt = readFileSync(file("開票n6.txt")).toString().replace(/\[HO]/g, nameHannin);
      await cc.send(txt);
    } else if (_scene === "開票6") {
      const nameHannin = readFileSync(file("name_hannin.txt")).toString().trim();
      const txt = readFileSync(file("開票6.txt")).toString().replace(/\[HO6]/g, nameHannin);
      await cc.send(txt);
    } else if (_scene === "今後のファミリー") {
      const nameHighest = readFileSync(file("name_highest.txt")).toString().trim();
      const txt = readFileSync(file("今後のファミリー.txt")).toString().replace(/\[HO]/g, nameHighest);
      await cc.send(txt);
    } else if (_scene === "解説") {
      await Promise.all(
        playersRole.members.map(async (user) => {
          return user.roles.add(audienceRole);
        })
      );

      const cc = await this.getTextChannel("共通情報");
      await cc.send({content: "タイムライン", files: [file("timeline.pdf")]});
    }
  }
}
