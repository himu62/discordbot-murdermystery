import {
  CategoryChannel,
  ChannelType,
  Guild,
  Role,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import {
  createTemplate,
  getCategory,
  getChannel,
  getRole,
  noPermission,
  readonlyPermission,
} from "../../src/util";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const characterNames = ["ヒダマリ", "フシグモ", "ミン"];
const voiceChannelNames = ["休憩室"];

const scenes = ["事前", "導入", "ルール", "休憩＋記憶回復", "質問", "解説"];

export class Scenario {
  guild: Guild;
  category: CategoryChannel;
  roles: Map<string, Role>;
  textChannels: Map<string, TextChannel>;
  voiceChannels: Map<string, VoiceChannel>;

  constructor(
    guild: Guild,
    category: CategoryChannel,
    roles: Map<string, Role>,
    textChannels: Map<string, TextChannel>,
    voiceChannels: Map<string, VoiceChannel>
  ) {
    this.guild = guild;
    this.category = category;
    this.roles = roles;
    this.textChannels = textChannels;
    this.voiceChannels = voiceChannels;
  }

  static async init(guild: Guild, prefix: string): Promise<Scenario> {
    const { category, roles, textChannels, voiceChannels } =
      await createTemplate(guild, {
        characterNames: characterNames,
        commonVoiceChannelNames: voiceChannelNames,
        scenes,
        prefix,
        scenarioName: "記憶回復センターへようこそ！",
        shortName: "記憶回復",
      });

    const audienceRole = roles.get("観戦");
    if (!audienceRole) return Promise.reject("観戦ロールの取得に失敗しました");

    await guild.channels.create({
      name: "解説",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
      ],
    });
    await guild.channels.create({
      name: "エンドカード",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
      ],
    });

    return new Scenario(guild, category, roles, textChannels, voiceChannels);
  }

  static async get(
    guild: Guild,
    categoryId: string,
    prefix: string
  ): Promise<Scenario> {
    const category = getCategory(
      guild,
      `${prefix}-記憶回復センターへようこそ！`
    );
    if (!category) return Promise.reject("カテゴリの取得に失敗しました");

    const roles = new Map<string, Role>();
    for (const name of characterNames) {
      const role = getRole(guild, `${prefix}${name}`);
      if (!role)
        return Promise.reject(`${prefix}${name}ロールの取得に失敗しました`);
      roles.set(name, role);
    }
    const audienceRole = getRole(guild, "記憶回復観戦");
    if (!audienceRole) return Promise.reject("観戦ロールの取得に失敗しました");
    const playersRole = getRole(guild, `${prefix}記憶回復PL`);
    if (!playersRole) return Promise.reject("PLロールの取得に失敗しました");
    roles.set("観戦", audienceRole);
    roles.set("PL", playersRole);

    const textChannels = new Map<string, TextChannel>();
    for (const name of characterNames.concat([
      "一般",
      "共通情報",
      "観戦",
      "解説",
      "エンドカード",
      "gm管理",
    ])) {
      const channel = getChannel(
        category,
        name,
        ChannelType.GuildText
      ) as TextChannel;
      if (!channel)
        return Promise.reject(
          `テキストチャンネル"${name}"の取得に失敗しました`
        );
      textChannels.set(name, channel);
    }

    const voiceChannels = new Map<string, VoiceChannel>();
    for (const name of voiceChannelNames) {
      const channel = getChannel(
        category,
        name,
        ChannelType.GuildVoice
      ) as VoiceChannel;
      if (!channel)
        return Promise.reject(`ボイスチャンネル"${name}"の取得に失敗しました`);
      voiceChannels.set(name, channel);
    }

    return new Scenario(guild, category, roles, textChannels, voiceChannels);
  }

  async scene(_scene: string): Promise<void> {
    if (_scene === "事前") {
      const commonInfoChannel = this.textChannels.get("共通情報");
      if (!commonInfoChannel)
        return Promise.reject("共通情報チャンネルの取得に失敗しました");
      await commonInfoChannel.send({
        content: "キャラクター",
        files: [join(__dirname, "/files/0_kyara.pdf")],
      });

      const explainChannel = this.textChannels.get("解説");
      if (!explainChannel)
        return Promise.reject("解説チャンネルの取得に失敗しました");
      await explainChannel.send({
        content: "真相解説",
        files: [join(__dirname, "/files/shinso.pdf")],
      });
      await explainChannel.send({
        content: "もっと真相解説",
        files: [join(__dirname, "/files/dasoku.pdf")],
      });

      const endCardChannel = this.textChannels.get("エンドカード");
      if (!endCardChannel)
        return Promise.reject("エンドカードチャンネルの取得に失敗しました");
      await endCardChannel.send({
        files: [
          join(__dirname, "/files/GM.png"),
          join(__dirname, "/files/HIDAMARI.png"),
          join(__dirname, "/files/FUSHIGUMO.png"),
          join(__dirname, "/files/MINN.png"),
        ],
      });
      await endCardChannel.send({
        content:
          "感想は #記憶回復 をつけて、誰でも見れるふせったーにすると作者さんが喜びます！たぶん。",
      });
    } else if (_scene === "導入") {
      const commonInfoChannel = this.textChannels.get("共通情報");
      if (!commonInfoChannel)
        return Promise.reject("共通情報チャンネルの取得に失敗しました");
      await commonInfoChannel.send({
        content: "導入",
        files: [join(__dirname, "/files/1_donyu.pdf")],
      });
    } else if (_scene === "ルール") {
      const commonInfoChannel = this.textChannels.get("共通情報");
      if (!commonInfoChannel)
        return Promise.reject("共通情報チャンネルの取得に失敗しました");

      const hosoku = readFileSync(
        join(__dirname, "/files/2_ruru_hosoku.txt")
      ).toString();

      await commonInfoChannel.send({
        content: "ルール",
        files: [join(__dirname, "/files/2_ruru.pdf")],
      });
      await commonInfoChannel.send({
        content: hosoku,
      });
    } else if (_scene === "休憩＋記憶回復") {
      await Promise.all(
        characterNames.map(async (chara) => {
          const charaChannel = this.textChannels.get(chara);
          if (!charaChannel)
            return Promise.reject(`${chara}チャンネルの取得に失敗しました`);
          await charaChannel.send({
            content: "休憩回復フェーズ",
            files: [join(__dirname, "/files/3_kyukei.kaihuku.pdf")],
          });
          await charaChannel.send({
            content:
              "PDFに「個室に移動してから続きを読んでください」とありますが、そのまま読んで問題ありません。",
          });
        })
      );
    } else if (_scene === "質問") {
      const commonInfoChannel = this.textChannels.get("共通情報");
      if (!commonInfoChannel)
        return Promise.reject("共通情報チャンネルの取得に失敗しました");
      await commonInfoChannel.send({
        content: "https://mivsflightlessairship.com/",
      });
    } else if (_scene === "解説") {
      const playersRole = this.roles.get("PL");
      if (!playersRole) return Promise.reject("PLロールの取得に失敗しました");
      const audienceRole = this.roles.get("観戦");
      if (!audienceRole)
        return Promise.reject("観戦ロールの取得に失敗しました");

      await Promise.all(
        playersRole.members.map(async (member) => {
          await member.roles.add(audienceRole);
        })
      );
    }
  }
}
