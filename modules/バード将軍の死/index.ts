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
import { AScenario } from "../../src/module";

const file = FILE(__dirname);

const scenarioName = "バード将軍の死";
const shortName = "バード将軍";
const characterNames = [
  "ヘンリ二世",
  "ジャック王子",
  "騎士ハリス",
  "執事トム",
  "女中メアリ",
];
const voiceChannelNames = ["会議室", "質問"];
const scenes = [
  "事前",
  "ルール説明",
  "HO配布",
  "プロローグ",
  "延長投票",
  "投票",
  "エンディング",
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

    await guild.channels.create({
      name: "はじめに",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ],
    });
    await guild.channels.create({
      name: "キャラクター",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ],
    });
    await guild.channels.create({
      name: "プロローグ",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
      ],
    });
    await guild.channels.create({
      name: "エンディング",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        noPermission(guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
      ],
    });
    await guild.channels.create({
      name: "解説",
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
    return super._get<Scenario>(Scenario, {
      guild,
      categoryId,
      prefix,
      scenarioName,
      shortName,
      characterNames,
      scenes,
      textChannelNames: [
        "一般",
        "共通情報",
        "はじめに",
        "キャラクター",
        "プロローグ",
        "エンディング",
        "解説",
        "gm管理",
      ],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    if (_scene === "事前") {
      const txtHajimeni = readFileSync(file("0_はじめに.txt")).toString();
      const txtRule = readFileSync(file("1_ルール.txt")).toString().split("@");
      const txtPrologue = readFileSync(file("2_プロローグ.txt")).toString();
      const txtEnding = readFileSync(file("3_エンディング.txt")).toString();
      const txtExplain = readFileSync(file("4_解説.txt")).toString().split("@");

      const chHajimeni = await this.getTextChannel("はじめに");
      await chHajimeni.send({ files: [file("0_タイトル.png")] });
      await chHajimeni.send({ content: txtHajimeni });

      const chCharacter = await this.getTextChannel("キャラクター");
      await chCharacter.send({
        content: "PC0. バード将軍",
        files: [file("pc0バード将軍.png")],
      });
      await chCharacter.send({
        content: "PC1. 国王ヘンリ二世",
        files: [file("pc1ヘンリ2世.png")],
      });
      await chCharacter.send({
        content: "PC2. ジャック王子",
        files: [file("pc2ジャック王子.png")],
      });
      await chCharacter.send({
        content: "PC3. 騎士ハリス",
        files: [file("pc3ハリス.png")],
      });
      await chCharacter.send({
        content: "PC4. 執事トム",
        files: [file("pc4トム.png")],
      });
      await chCharacter.send({
        content: "PC5. 女中メアリ",
        files: [file("pc5メアリ.png")],
      });

      const chCommonInfo = await this.getTextChannel("共通情報");
      for (const txt of txtRule) {
        await chCommonInfo.send({ content: txt });
      }

      const chPrologue = await this.getTextChannel("プロローグ");
      await chPrologue.send({ content: txtPrologue });

      const chEnding = await this.getTextChannel("エンディング");
      await chEnding.send({ content: txtEnding });

      const chExplain = await this.getTextChannel("解説");
      for (const txt of txtExplain) {
        await chExplain.send({ content: txt });
      }

      const chCharacters = await Promise.all(
        characterNames.map(async (chara) => {
          return await this.getTextChannel(chara);
        })
      );
      await sendInfoToIndividualChannel(chCharacters);
      // } else if (_scene === "ルール説明") {
      // } else if (_scene === "HO配布") {
      // } else if (_scene === "プロローグ") {
      // } else if (_scene === "エンディング") {
      // } else if (_scene === "解説") {
    }
  }
}
