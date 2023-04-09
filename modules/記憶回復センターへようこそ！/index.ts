import {CategoryChannel, ChannelType, Guild, Role, TextChannel, VoiceChannel,} from "discord.js";
import {FILE, noPermission, readonlyPermission, sendInfoToIndividualChannel,} from "../../src/util";
import {readFileSync} from "node:fs";
import {AScenario} from "../../src/module";

const file = FILE(__dirname);

const scenarioName = "記憶回復センターへようこそ！";
const shortName = "記憶回復";
const characterNames = ["ヒダマリ", "フシグモ", "ミン"];
const voiceChannelNames = ["休憩室"];
const scenes = ["事前", "導入", "ルール", "休憩＋記憶回復", "質問", "解説"];

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
    const {category, roles, textChannels, voiceChannels, audienceRole} =
      await super._init(guild, {
        scenarioName,
        shortName,
        characterNames,
        voiceChannelNames,
        scenes,
        prefix,
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
    return super._get<Scenario>(Scenario, {
      guild,
      categoryId,
      prefix,
      scenarioName,
      shortName,
      characterNames,
      scenes,
      textChannelNames: [
        "連絡・雑談",
        "共通情報",
        "観戦",
        "解説",
        "エンドカード",
        "gm管理",
      ],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const chCommonInfo = await this.getTextChannel("共通情報");

    if (_scene === "事前") {
      await chCommonInfo.send({
        content: "キャラクター",
        files: [file("0_kyara.pdf")],
      });

      const chExplain = await this.getTextChannel("解説");
      await chExplain.send({
        content: "真相解説",
        files: [file("shinso.pdf")],
      });
      await chExplain.send({
        content: "もっと真相解説",
        files: [file("dasoku.pdf")],
      });

      const chEndCard = await this.getTextChannel("エンドカード");
      await chEndCard.send({
        files: [
          file("GM.png"),
          file("HIDAMARI.png"),
          file("FUSHIGUMO.png"),
          file("MINN.png"),
        ],
      });
      await chEndCard.send({
        content:
          "感想は #記憶回復 をつけて、誰でも見れるふせったーにすると作者さんが喜びます！たぶん。",
      });

      const chCharacters = await Promise.all(
        characterNames.map(async (chara) => {
          return this.getTextChannel(chara);
        })
      );
      await sendInfoToIndividualChannel(chCharacters);
    } else if (_scene === "導入") {
      await chCommonInfo.send({
        content: "導入",
        files: [file("1_donyu.pdf")],
      });
    } else if (_scene === "ルール") {
      const hosoku = readFileSync(file("2_ruru_hosoku.txt")).toString();

      await chCommonInfo.send({
        content: "ルール",
        files: [file("2_ruru.pdf")],
      });
      await chCommonInfo.send({
        content: hosoku,
      });
    } else if (_scene === "休憩＋記憶回復") {
      await Promise.all(
        characterNames.map(async (chara) => {
          const ch = await this.getTextChannel(chara);
          await ch.send({
            content: "休憩回復フェーズ",
            files: [file("3_kyukei.kaihuku.pdf")],
          });
          return ch.send({
            content:
              "PDFに「個室に移動してから続きを読んでください」とありますが、そのまま読んで問題ありません。",
          });
        })
      );
    } else if (_scene === "質問") {
      await chCommonInfo.send({
        content: "質問フォーム→ https://mivsflightlessairship.com/",
      });
    } else if (_scene === "解説") {
      const audienceRole = await this.getRole("観戦");
      const playersRole = await this.getRole("PL");
      console.log(playersRole.members);
      await Promise.all(
        playersRole.members.map(async (member) => {
          return member.roles.add(audienceRole);
        })
      );
    }
  }
}
