import {
  CategoryChannel,
  ChannelType,
  Guild,
  Role,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { AScenario } from "../../src/module";
import {
  FILE,
  noPermission,
  readonlyPermission,
  sendInfoToIndividualChannel,
} from "../../src/util";
import { config } from "../../src/config";

const file = FILE(__dirname);

const scenarioName = "ブルーホールミステリー1";
const shortName = "ブルーホール1";
const characterNames = [
  "香流万里",
  "獅子浜道義",
  "光ヶ丘久々利",
  "仁和寺登美",
  "ネコ太",
];
const voiceChannelNames = ["坂通り前螺旋ホテル", "北区", "南区"];
const scenes = [
  "事前",
  "過去HO配布",
  "予知夢・タイムライン配布",
  "予知夢・ミッション配布",
  "予知夢・投票",
  "予知夢・エピローグ配布",
  "現実・導入タイムライン配布",
  "現実・香流タイムラインA配布",
  "現実・香流タイムラインB配布",
  "現実・光ヶ丘タイムラインA配布",
  "現実・光ヶ丘タイムラインB配布",
  "現実・ミッション配布",
  "現実・投票",
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
    const { category, roles, textChannels, voiceChannels } = await super._init(
      guild,
      {
        scenarioName,
        shortName,
        characterNames,
        voiceChannelNames,
        scenes,
        prefix,
      }
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
      textChannelNames: ["連絡・雑談", "共通情報", "観戦", "gm管理"],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const chNames = ["banri", "dougi", "kukuri", "tomi", "nekota"];

    if (_scene === "事前") {
      const chCommon = await this.getTextChannel("共通情報");
      await chCommon.send({
        content: "事前配布資料",
        files: [file("pre.pdf")],
      });

      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await sendInfoToIndividualChannel(chPlayers);
    } else if (_scene === "過去HO配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "あなたの過去",
            files: [file(`${ch}_past.pdf`)],
          })
        )
      );
    } else if (_scene === "予知夢・タイムライン配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "当日の記憶",
            files: [file(`${ch}_timeline.pdf`)],
          })
        )
      );
    } else if (_scene === "予知夢・ミッション配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "ミッション",
            files: [file(`${ch}_mission.pdf`)],
          })
        )
      );
    } else if (_scene === "予知夢・投票") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i]
            .send(`=====================================================================
「奇跡のブルー」の宿主として誰に投票しますか？
→
=====================================================================
回答は <@${config.gmUserId}> をつけて送ってください。修正する場合は、メッセージの編集ではなく、再送信してください。`)
        )
      );
    } else if (_scene === "予知夢・エピローグ配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "エピローグ",
            files: [file(`${ch}_epilogue.pdf`)],
          })
        )
      );
    } else if (_scene === "現実・導入タイムライン配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "現実パート・導入",
            files: [file(`${ch}_intro_2.pdf`)],
          })
        )
      );
      const chPlayers2 = [chPlayers[1], chPlayers[3], chPlayers[4]];
      await Promise.all(
        ["dougi", "tomi", "nekota"].map(async (ch, i) =>
          chPlayers2[i].send({
            content: "現実パート・当日の記憶",
            files: [file(`${ch}_timeline_2.pdf`)],
          })
        )
      );
      const chPlayers3 = [chPlayers[0], chPlayers[2]];
      await Promise.all(
        chPlayers3.map(async (c) =>
          c.send(
            `HO最下部にある選択肢のどちらを選ぶか、 <@${config.gmUserId}> をつけて回答してください。GMが確認次第、追加のHOを配布します。`
          )
        )
      );
    } else if (_scene === "現実・香流タイムラインA配布") {
      const ch = await this.getTextChannel("香流万里");
      await ch.send({
        content: "現実パート・当日の記憶",
        files: [file("banri_timeline_2_a.pdf")],
      });
    } else if (_scene === "現実・香流タイムラインB配布") {
      const ch = await this.getTextChannel("香流万里");
      await ch.send({
        content: "現実パート・当日の記憶",
        files: [file("banri_timeline_2_b.pdf")],
      });
    } else if (_scene === "現実・光ヶ丘タイムラインA配布") {
      const ch = await this.getTextChannel("光ヶ丘久々利");
      await ch.send({
        content: "現実パート・当日の記憶",
        files: [file("kukuri_timeline_2_a.pdf")],
      });
    } else if (_scene === "現実・光ヶ丘タイムラインB配布") {
      const ch = await this.getTextChannel("光ヶ丘久々利");
      await ch.send({
        content: "現実パート・当日の記憶",
        files: [file("kukuri_timeline_2_b.pdf")],
      });
    } else if (_scene === "現実・ミッション配布") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i].send({
            content: "現実パート・ミッション",
            files: [file(`${ch}_mission_2.pdf`)],
          })
        )
      );
    } else if (_scene === "現実・投票") {
      const chPlayers = await Promise.all(
        characterNames.map(async (c) => this.getTextChannel(c))
      );
      await Promise.all(
        chNames.map(async (ch, i) =>
          chPlayers[i]
            .send(`=====================================================================
「奇跡のブルー」の宿主として誰に投票しますか？
→
=====================================================================
回答は <@${config.gmUserId}> をつけて送ってください。修正する場合は、メッセージの編集ではなく、再送信してください。`)
        )
      );
    } else if (_scene === "解説") {
      const chCommon = await this.getTextChannel("共通情報");
      await chCommon.send({
        content: "解説",
        files: [file("kaisetsu.pdf")],
      });
      await chCommon.send({
        content: "あとがき",
        files: [file("atogaki.pdf")],
      });
    }
  }
}
