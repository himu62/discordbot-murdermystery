import {CategoryChannel, ChannelType, Guild, Role, TextChannel, VoiceChannel,} from "discord.js";
import {AScenario} from "../../src/module";
import {FILE, noPermission, readonlyPermission, sendInfoToIndividualChannel} from "../../src/util";
import {readFileSync} from "node:fs";
import {config} from "../../src/config";

const file = FILE(__dirname);

const scenarioName = "LYCAN";
const shortName = "LYCAN";
const characterNames = ["旅人", "神父", "村娘", "遊び人", "羊飼い"];
const voiceChannelNames = ["教会", "懺悔室"];
const scenes = ["事前", "ルール説明", "HO配布", "プロローグ", "神父追加HO", "投票", "解説"];

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
      audienceRole
    } = await super._init(guild, {
      scenarioName,
      shortName,
      characterNames,
      voiceChannelNames,
      scenes,
      prefix,
    });

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
      textChannelNames: ["一般", "共通情報", "観戦", "解説", "gm管理"],
      voiceChannelNames,
    });
  }

  async scene(_scene: string): Promise<void> {
    const chCommonInfo = await this.getTextChannel("共通情報");

    if (_scene === "事前") {
      await chCommonInfo.send({files: [file("旅人.png")]});
      await chCommonInfo.send({
        content: "【PC1】旅人\n" +
          "彼（？）は事件当日の昼、村を訪れた旅人。数日間滞在するとのことで村長から村長宅の離れを借りていた。非常に美しい顔立ちで性別は不明。村に来た理由もわからない謎多き人物。"
      });
      await chCommonInfo.send({files: [file("神父.png")]});
      await chCommonInfo.send({
        content: "【PC2】神父\n" +
          "彼は神父。今回村長の検死を担当した。兄妹である村娘との仲はもちろん、遊び人とは幼い頃からの親友、羊飼いとは隣人として村人との関係性は良好に見える。毎日日記をつける几帳面な性格。教会には神父の自室があり、そこで寝泊まりしている。"
      });
      await chCommonInfo.send({files: [file("村娘.png")]});
      await chCommonInfo.send({
        content: "【PC3】村娘\n" +
          "彼女は村娘。神父とは兄妹の関係であり、共に村の畑を管理している。最近は高齢の村長の世話をするなどよく村長宅に出入りしていた。面倒見のいい女性。"
      });
      await chCommonInfo.send({files: [file("遊び人.png")]});
      await chCommonInfo.send({
        content: "【PC4】遊び人\n" +
          "彼は村長の孫であり、働きもせずフラフラしている遊び人。軽薄そうな男性で村長とはしょっちゅう喧嘩をしていたことを村人は知っている。最近は特に喧嘩の頻度が多くなっていたようだ。"
      });
      await chCommonInfo.send({files: [file("羊飼い.png")]});
      await chCommonInfo.send({
        content: "【PC5】羊飼い\n" +
          "彼女は羊飼い。最近牧場で獣に羊が襲われる事件が多発しており、昨日はその件を巡って村長と何か話していたようだ。村人の中では新参者。すこし臆病な性格に見える。"
      });

      const chExplain = await this.getTextChannel("解説");
      await chExplain.send({
        content: "解説",
        files: [file("kaisetsu.pdf")],
      });

      const txt = readFileSync(file("story.txt")).toString();
      await chCommonInfo.send({content: txt});

      const chPlayers = await Promise.all(this.characterNames.map(async (chara) => this.getTextChannel(chara)));
      await sendInfoToIndividualChannel(chPlayers);
    } else if (_scene === "ルール説明") {
      await chCommonInfo.send({content: "ルール", files: [file("0_rule.pdf")]});
    } else if (_scene === "HO配布") {
      const ho1 = await this.getTextChannel("旅人");
      await ho1.send({files: [file("PC1_traveller.pdf")]});
      const ho2 = await this.getTextChannel("神父");
      await ho2.send({files: [file("PC2_priest.pdf")]});
      const ho3 = await this.getTextChannel("村娘");
      await ho3.send({files: [file("PC3_girl.pdf")]});
      const ho4 = await this.getTextChannel("遊び人");
      await ho4.send({files: [file("PC4_playboy.pdf")]});
      const ho5 = await this.getTextChannel("羊飼い");
      await ho5.send({files: [file("PC5_shepherd.pdf")]});
    } else if (_scene === "プロローグ") {
      await chCommonInfo.send({content: "プロローグ", files: [file("1_prologue.pdf")]});
    } else if (_scene === "神父追加HO") {
      const ho2 = await this.getTextChannel("神父");
      await ho2.send({content: "神父の隠しストーリー", files: [file("priest_secret.pdf")]});
    } else if (_scene === "投票") {
      const txt = readFileSync(file("投票.txt"))
        .toString()
        .replace("@GM", `<@${config.gmUserId}>`);

      await Promise.all(
        this.characterNames.map(async (chara) => {
          const ch = await this.getTextChannel(chara);
          return ch.send({content: txt});
        })
      );
    } else if (_scene === "解説") {
      const audienceRole = await this.getRole("観戦");
      const playersRole = await this.getRole("PL");
      await Promise.all(
        playersRole.members.map(async (chara) => {
          return chara.roles.add(audienceRole);
        })
      );
    }
  }
}
