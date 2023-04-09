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
import { read, readFileSync } from "node:fs";

const file = FILE(__dirname);

const scenarioName = "くちなしのきみへ";
const shortName = "くちなし";
const characterNames = ["長谷川和樹", "菅原紀之", "藤村弥生", "夏川芽衣"];
const voiceChannelNames = ["教室", "教室の隅"];
const scenes = [
  "事前",
  "ルール",
  "HO配布",
  "プロローグ",
  "投票（アンケート）",
  "エンディング・長谷川",
  "エンディング・菅原",
  "エンディング・藤村",
  "エンディング・夏川",
  "エンディング・高橋先生",
  "エンディング・事故自殺同票",
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
      "プロローグ",
      await guild.channels.create({
        parent: category,
        type: ChannelType.GuildText,
        name: "プロローグ",
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
        ],
      })
    );
    textChannels.set(
      "エンディング",
      await guild.channels.create({
        parent: category,
        type: ChannelType.GuildText,
        name: "エンディング",
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
      textChannelNames: [
        "連絡・雑談",
        "共通情報",
        "観戦",
        "プロローグ",
        "エンディング",
        "解説",
        "gm管理",
      ],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const chCommonInfo = await this.getTextChannel("共通情報");
    const playersRole = await this.getRole("PL");
    const audienceRole = await this.getRole("観戦");

    if (_scene === "事前") {
      await chCommonInfo.send({ files: [file("01_arasuji.png")] });
      await chCommonInfo.send({
        files: [
          file("02_PC1.png"),
          file("02_PC2.png"),
          file("02_PC3.png"),
          file("02_PC4.png"),
          file("02_NPC1.png"),
          file("02_NPC2.png"),
        ],
      });

      const cp = await this.getTextChannel("プロローグ");
      await cp.send(readFileSync(file("prologue.txt")).toString());

      const cexp = await this.getTextChannel("解説");
      await cexp.send({ content: "真相", files: [file("truth.pdf")] });
      await cexp.send({ content: "時系列", files: [file("timeline.pdf")] });
      await cexp.send(`・オンセ鯖の通過ロールを付与します（ネタバレチャンネルが見れるようになります）
・キャラクター名はネタバレOKです
・「犯人だった」「犯人がわからなかった」「これは事故だ」などの感想はネタバレになります`);

      const chPlayers = await Promise.all(
        this.characterNames.map(async (chara) => this.getTextChannel(chara))
      );
      await sendInfoToIndividualChannel(chPlayers);
    } else if (_scene === "ルール") {
      await chCommonInfo.send({ files: [file("03_shinko.png")] });
      await chCommonInfo.send({ files: [file("04_rule.png")] });
      await chCommonInfo.send({
        files: [
          file("05_map1f.png"),
          file("05_map2f.png"),
          file("05_map3f.png"),
          file("05_mapschool.png"),
        ],
      });
    } else if (_scene === "HO配布") {
      const c1 = await this.getTextChannel("長谷川和樹");
      await c1.send({ files: [file("ho1_hasegawa.pdf")] });
      const c2 = await this.getTextChannel("菅原紀之");
      await c2.send({ files: [file("ho2_sugawara.pdf")] });
      const c3 = await this.getTextChannel("藤村弥生");
      await c3.send({ files: [file("ho3_fujimura.pdf")] });
      const c4 = await this.getTextChannel("夏川芽衣");
      await c4.send({ files: [file("ho4_natsukawa.pdf")] });

      await Promise.all(
        [c1, c2, c3, c4].map(async (c) =>
          c.send(
            `読み込み時間の延長が欲しい場合は、このチャンネルで <@${config.gmUserId}> を付けて延長希望の旨を教えてください。`
          )
        )
      );
    } else if (_scene === "プロローグ") {
      const c = await this.getTextChannel("プロローグ");
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "投票（アンケート）") {
      const c1 = await this.getTextChannel("長谷川和樹");
      await c1.send(
        readFileSync(file("投票_長谷川.txt"))
          .toString()
          .replace("@GM", `<@${config.gmUserId}>`)
      );
      const c2 = await this.getTextChannel("菅原紀之");
      await c2.send(
        readFileSync(file("投票_菅原.txt"))
          .toString()
          .replace("@GM", `<@${config.gmUserId}>`)
      );
      const c3 = await this.getTextChannel("藤村弥生");
      await c3.send(
        readFileSync(file("投票_藤村.txt"))
          .toString()
          .replace("@GM", `<@${config.gmUserId}>`)
      );
      const c4 = await this.getTextChannel("夏川芽衣");
      await c4.send(
        readFileSync(file("投票_夏川.txt"))
          .toString()
          .replace("@GM", `<@${config.gmUserId}>`)
      );
    } else if (_scene === "エンディング・長谷川") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_hasegawa.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "エンディング・菅原") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_sugawara.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "エンディング・藤村") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_fujimura.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "エンディング・夏川") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_natsukawa.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "エンディング・高橋先生") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_takahashi.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "エンディング・事故自殺同票") {
      const c = await this.getTextChannel("エンディング");
      await c.send(readFileSync(file("end_sugino.txt")).toString());
      await c.permissionOverwrites.set([
        noPermission(this.guild.roles.everyone.id),
        readonlyPermission(audienceRole.id),
        readonlyPermission(playersRole.id),
      ]);
    } else if (_scene === "解説") {
      console.log(playersRole.members);
      await Promise.all(
        playersRole.members.map(async (u) => u.roles.add(audienceRole))
      );
    }
  }
}
