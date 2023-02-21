import { AScenario } from "../../src/module";
import {
  CategoryChannel,
  ChannelType,
  Guild,
  Role,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import {
  FILE,
  noPermission,
  readonlyPermission,
  sendInfoToIndividualChannel,
} from "../../src/util";
import { readFileSync } from "node:fs";
import { config } from "../../src/config";

const file = FILE(__dirname);

const scenarioName = "エイダ";
const shortName = "エイダ";
const characterNames = [
  "スタン・ローデン",
  "ヴァル・ドレッド",
  "マリン・アントワーネ",
  "ドラゴ・ヴァルスローダ",
  "リリー・フローラ",
];
const voiceChannelNames = ["玉座の間", "寝室"];
const scenes = [
  "事前",
  "記憶回復・スタン",
  "記憶回復・ヴァル",
  "記憶回復・マリン",
  "記憶回復・ドラゴ",
  "記憶回復・リリー",
  "投票",
  "HOエイダ公開",
  "解説",
];

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
    const { category, roles, textChannels, voiceChannels, audienceRole } =
      await super._init(guild, {
        scenarioName,
        shortName,
        characterNames,
        voiceChannelNames,
        scenes,
        prefix,
      });

    textChannels.set(
      "エイダ・ローデン",
      await guild.channels.create({
        parent: category,
        type: ChannelType.GuildText,
        name: "エイダ・ローデン",
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
        ],
      })
    );

    textChannels.set(
      "解説",
      await guild.channels.create({
        parent: category,
        type: ChannelType.GuildText,
        name: "解説",
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
        ],
      })
    );

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
      textChannelNames: ["一般", "観戦", "エイダ・ローデン", "解説", "gm管理"],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const audienceRole = await this.getRole("観戦");
    const playersRole = await this.getRole("PL");

    if (_scene === "事前") {
      const chHo1 = await this.getTextChannel("スタン・ローデン");
      const chHo2 = await this.getTextChannel("ヴァル・ドレッド");
      const chHo3 = await this.getTextChannel("マリン・アントワーネ");
      const chHo4 = await this.getTextChannel("ドラゴ・ヴァルスローダ");
      const chHo5 = await this.getTextChannel("リリー・フローラ");
      await sendInfoToIndividualChannel([chHo1, chHo2, chHo3, chHo4, chHo5]);

      await chHo1.send({ files: [file("ho1_stan.pdf")] });
      await chHo2.send({ files: [file("ho2_val.pdf")] });
      await chHo3.send({ files: [file("ho3_marine.pdf")] });
      await chHo4.send({ files: [file("ho4_drago.pdf")] });
      await chHo5.send({ files: [file("ho5_lily.pdf")] });

      const chEida = await this.getTextChannel("エイダ・ローデン");
      await chEida.send({ files: [file("ho_eida.pdf")] });

      const chExplain = await this.getTextChannel("解説");
      await chExplain.send({ files: [file("kaisetsu.pdf")] });
      await chExplain.send({
        content:
          "・エンドカードはありません。\n・オンセ鯖の通過ロールを付与します。\n・キャラクター名はネタバレ禁止です。",
      });
    } else if (_scene === "記憶回復・スタン") {
      const ch = await this.getTextChannel("スタン・ローデン");
      await ch.send({
        content: "追加HO「失われた記憶」",
        files: [file("ho1_stan_2.pdf")],
      });
    } else if (_scene === "記憶回復・ヴァル") {
      const ch = await this.getTextChannel("ヴァル・ドレッド");
      await ch.send({
        content: "追加HO「失われた記憶」",
        files: [file("ho2_val_2.pdf")],
      });
    } else if (_scene === "記憶回復・マリン") {
      const ch = await this.getTextChannel("マリン・アントワーネ");
      await ch.send({
        content: "追加HO「失われた記憶」",
        files: [file("ho3_marine_2.pdf")],
      });
    } else if (_scene === "記憶回復・ドラゴ") {
      const ch = await this.getTextChannel("ドラゴ・ヴァルスローダ");
      await ch.send({
        content: "追加HO「失われた記憶」",
        files: [file("ho4_drago_2.pdf")],
      });
    } else if (_scene === "記憶回復・リリー") {
      const ch = await this.getTextChannel("リリー・フローラ");
      await ch.send({
        content: "追加HO「失われた記憶」",
        files: [file("ho5_lily_2.pdf")],
      });
    } else if (_scene === "投票") {
      const txt = readFileSync(file("投票.txt"))
        .toString()
        .replace("@GM", `<@${config.gmUserId}>`);

      await Promise.all(
        this.characterNames.map(async (chara) => {
          const ch = await this.getTextChannel(chara);
          return ch.send({ content: txt });
        })
      );
    } else if (_scene === "HOエイダ公開") {
      const ch = await this.getTextChannel("エイダ・ローデン");
      await ch.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "解説") {
      await Promise.all(
        playersRole.members.map(async (user) => {
          return user.roles.add(audienceRole);
        })
      );
    }
  }
}
