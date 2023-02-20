import * as fs from "node:fs";
import {
  ActionRowBuilder,
  CategoryChannel,
  ChannelType,
  Guild,
  Role,
  StringSelectMenuBuilder,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import {
  getCategory,
  getChannel,
  getRole,
  noPermission,
  readonlyPermission,
  writerPermission,
} from "./util";

export interface IScenario {
  init: (guild: Guild, prefix: string) => Promise<AScenario>;
  get: (guild: Guild, categoryId: string, prefix: string) => Promise<AScenario>;
}

type Modules = Map<string, IScenario>;

class ModuleClass {
  private static readonly modulesDir = "./modules";
  private static _instance: Modules;

  public static get instance(): Modules {
    if (!this._instance) {
      this._instance = new Map<string, IScenario>();
      fs.readdirSync(this.modulesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .forEach((dirent) => {
          import(`.${this.modulesDir}/${dirent.name}`)
            .then((m) => {
              this._instance.set(dirent.name, m.Scenario);
            })
            .catch((err) => {
              console.error(
                `module "${dirent.name}" の読み込みに失敗しました`,
                err
              );
            });
        });
    }
    return this._instance;
  }
}

export const modules = ModuleClass.instance;

export class AScenario {
  protected scenarioName: string;
  protected shortName: string;
  protected characterNames: string[];
  protected voiceChannelNames: string[];
  protected scenes: string[];

  protected guild: Guild;
  protected category: CategoryChannel;
  protected roles: Map<string, Role>;
  protected textChannels: Map<string, TextChannel>;
  protected voiceChannels: Map<string, VoiceChannel>;

  constructor(args: {
    scenarioName: string;
    shortName: string;
    characterNames: string[];
    voiceChannelNames: string[];
    scenes: string[];
    guild: Guild;
    category: CategoryChannel;
    roles: Map<string, Role>;
    textChannels: Map<string, TextChannel>;
    voiceChannels: Map<string, VoiceChannel>;
  }) {
    this.scenarioName = args.scenarioName;
    this.shortName = args.shortName;
    this.characterNames = args.characterNames;
    this.voiceChannelNames = args.voiceChannelNames;
    this.scenes = args.scenes;
    this.guild = args.guild;
    this.category = args.category;
    this.roles = args.roles;
    this.textChannels = args.textChannels;
    this.voiceChannels = args.voiceChannels;
  }

  async getRole(key: string): Promise<Role> {
    const role = this.roles.get(key);
    if (!role) return Promise.reject(`${key}ロールの取得に失敗しました`);
    return Promise.resolve(role);
  }

  async getTextChannel(key: string): Promise<TextChannel> {
    const ch = this.textChannels.get(key);
    if (!ch)
      return Promise.reject(`${key}テキストチャンネルの取得に失敗しました`);
    return Promise.resolve(ch);
  }

  async getVoiceChannel(key: string): Promise<VoiceChannel> {
    const ch = this.voiceChannels.get(key);
    if (!ch)
      return Promise.reject(`${key}ボイスチャンネルの取得に失敗しました`);
    return Promise.resolve(ch);
  }

  static async _init(
    guild: Guild,
    input: {
      scenarioName: string;
      shortName: string;
      characterNames: string[];
      voiceChannelNames: string[];
      scenes: string[];
      prefix: string;
    }
  ): Promise<{
    category: CategoryChannel;
    roles: Map<string, Role>;
    textChannels: Map<string, TextChannel>;
    voiceChannels: Map<string, VoiceChannel>;
    audienceRole: Role;
    playersRole: Role;
  }> {
    const roles = new Map<string, Role>();
    const audienceRole =
      getRole(guild, `${input.shortName}観戦`) ??
      (await guild.roles.create({ name: `${input.shortName}観戦` }));
    const playersRole = await guild.roles.create({
      name: `${input.prefix}${input.shortName}PL`,
    });
    roles.set("観戦", audienceRole);
    roles.set("PL", playersRole);

    const category = await guild.channels.create({
      name: `${input.prefix}-${input.scenarioName}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [noPermission(guild.roles.everyone.id)],
    });

    const textChannels = new Map<string, TextChannel>();
    textChannels.set(
      "一般",
      await guild.channels.create({
        name: "一般",
        parent: category,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
          writerPermission(playersRole.id),
        ],
      })
    );
    textChannels.set(
      "共通情報",
      await guild.channels.create({
        name: "共通情報",
        parent: category,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          readonlyPermission(audienceRole.id),
          readonlyPermission(playersRole.id),
        ],
      })
    );
    textChannels.set(
      "観戦",
      await guild.channels.create({
        name: "観戦",
        parent: category,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          noPermission(guild.roles.everyone.id),
          writerPermission(audienceRole.id),
        ],
      })
    );
    await Promise.all(
      input.characterNames.map(async (name) => {
        const role = await guild.roles.create({
          name: `${input.prefix}${name}`,
        });
        roles.set(name, role);
        textChannels.set(
          name,
          await guild.channels.create({
            name,
            parent: category,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              noPermission(guild.roles.everyone.id),
              readonlyPermission(audienceRole.id),
              writerPermission(role.id),
            ],
          })
        );
      })
    );

    const voiceChannels = new Map<string, VoiceChannel>();
    await Promise.all(
      input.voiceChannelNames.map(async (name) => {
        voiceChannels.set(
          name,
          await guild.channels.create({
            name,
            parent: category,
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
              noPermission(guild.roles.everyone.id),
              writerPermission(audienceRole.id),
              writerPermission(playersRole.id),
            ],
          })
        );
      })
    );

    const gmChannel = await guild.channels.create({
      name: "gm管理",
      parent: category,
      type: ChannelType.GuildText,
      permissionOverwrites: [noPermission(guild.roles.everyone.id)],
    });
    textChannels.set("gm管理", gmChannel);
    await gmChannel.send({
      content: "シーン切り替え",
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(
              `scene\\${input.scenarioName}\\${category.id}\\${input.prefix}`
            )
            .addOptions(
              input.scenes.map((scene) => {
                return { label: scene, value: scene };
              })
            )
        ),
      ],
    });

    return {
      category,
      roles,
      textChannels,
      voiceChannels,
      audienceRole,
      playersRole,
    };
  }

  static async _get<T extends AScenario>(
    type: {
      new (
        guild: Guild,
        category: CategoryChannel,
        roles: Map<string, Role>,
        textChannels: Map<string, TextChannel>,
        voiceChannels: Map<string, VoiceChannel>
      ): T;
    },
    input: {
      guild: Guild;
      categoryId: string;
      prefix: string;
      scenarioName: string;
      shortName: string;
      characterNames: string[];
      scenes: string[];
      textChannelNames: string[];
      voiceChannelNames: string[];
    }
  ): Promise<T> {
    const category = getCategory(
      input.guild,
      `${input.prefix}-${input.scenarioName}`
    );
    if (!category) return Promise.reject("カテゴリの取得に失敗しました");

    const roles = new Map<string, Role>();
    for (const name of input.characterNames) {
      const role = getRole(input.guild, `${input.prefix}${name}`);
      if (!role)
        return Promise.reject(
          `${input.prefix}${name}ロールの取得に失敗しました`
        );
      roles.set(name, role);
    }
    const audienceRole = getRole(input.guild, `${input.shortName}観戦`);
    if (!audienceRole) return Promise.reject("観戦ロールの取得に失敗しました");
    const playersRole = getRole(
      input.guild,
      `${input.prefix}${input.shortName}PL`
    );
    if (!playersRole) return Promise.reject("PLロールの取得に失敗しました");
    roles.set("観戦", audienceRole);
    roles.set("PL", playersRole);

    const textChannels = new Map<string, TextChannel>();
    for (const name of input.characterNames.concat(input.textChannelNames)) {
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
    for (const name of input.voiceChannelNames) {
      const channel = getChannel(
        category,
        name,
        ChannelType.GuildVoice
      ) as VoiceChannel;
      if (!channel)
        return Promise.reject(`ボイスチャンネル"${name}"の取得に失敗しました`);
      voiceChannels.set(name, channel);
    }

    return new type(input.guild, category, roles, textChannels, voiceChannels);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async scene(_scene: string): Promise<void> {
    return Promise.resolve();
  }
}
