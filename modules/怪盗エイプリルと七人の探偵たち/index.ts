import { join } from "node:path";
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
  writerPermission,
} from "../../src/util";

const scenes = [
  "事前",
  "プロローグ",
  "議論",
  "投票",
  "拘束",
  "エンド葛城",
  "エンド真木沼",
  "エンド稔堂",
  "エンド怜悧",
  "エンド秋葉原",
  "エンド四月",
  "エンド道楽",
  "解説・怜悧",
  "解説・四月",
  "解説・秋葉原",
  "解説・道楽",
  "解説・真木沼",
  "解説・稔堂",
  "解説・葛城",
  "感想戦",
];

const characterNames = [
  "真木沼矢文",
  "秋葉原ミカヅキ",
  "稔堂自然",
  "四月総介",
  "葛城御道",
  "奥座敷怜悧",
  "奥座敷道楽",
];

const voiceChannelNames = ["エントランス", "秋の間", "冬の間", "春の間"];

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
        scenarioName: "怪盗エイプリルと七人の探偵たち",
        shortName: "エイプリル",
        characterNames: characterNames,
        commonVoiceChannelNames: voiceChannelNames,
        scenes,
        prefix,
      });

    const dourakuRole = roles.get("奥座敷道楽");
    const audienceRole = roles.get("観戦");
    if (!dourakuRole || !audienceRole) {
      return Promise.reject("道楽ロールまたは観戦ロールの取得に失敗しました");
    }
    textChannels.set(
      "道楽調査",
      await guild.channels.create({
        name: "道楽調査",
        parent: category,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
          writerPermission(dourakuRole.id),
        ],
      })
    );
    textChannels.set(
      "エンディング",
      await guild.channels.create({
        name: "エンディング",
        parent: category,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
        ],
      })
    );
    textChannels.set(
      "解説",
      await guild.channels.create({
        name: "解説",
        parent: category,
        type: ChannelType.GuildText,
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
    const category = getCategory(
      guild,
      `${prefix}-怪盗エイプリルと七人の探偵たち`
    );
    if (!category) return Promise.reject("カテゴリの取得に失敗しました");

    const roles = new Map<string, Role>();
    for (const name of characterNames) {
      const role = getRole(guild, `${prefix}${name}`);
      if (!role)
        return Promise.reject(`${prefix}${name}ロールの取得に失敗しました`);
      roles.set(name, role);
    }
    const audienceRole = getRole(guild, "エイプリル観戦");
    if (!audienceRole) return Promise.reject("観戦ロールの取得に失敗しました");
    const playersRole = getRole(guild, `${prefix}エイプリルPL`);
    if (!playersRole) return Promise.reject("PLロールの取得に失敗しました");
    roles.set("観戦", audienceRole);
    roles.set("PL", playersRole);

    const textChannels = new Map<string, TextChannel>();
    for (const name of characterNames.concat([
      "一般",
      "共通情報",
      "観戦",
      "エンディング",
      "解説",
      "道楽調査",
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
      const generalChannel = this.textChannels.get("一般");
      if (!generalChannel)
        return Promise.reject("一般チャンネルの取得に失敗しました");
      const commonInfoChannel = this.textChannels.get("共通情報");
      if (!commonInfoChannel)
        return Promise.reject("共通情報チャンネルの取得に失敗しました");

      await generalChannel.send("https://booth.pm/ja/items/4058480");
      await commonInfoChannel.send({
        content: "キャラクター",
        files: [join(__dirname, "/files/0_character.pdf")],
      });
    }
  }
}
