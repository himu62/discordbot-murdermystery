import {
  ActionRowBuilder,
  CategoryChannel,
  Channel,
  ChannelType,
  Guild,
  OverwriteResolvable,
  PermissionsBitField,
  Role,
  StringSelectMenuBuilder,
  TextChannel,
  VoiceChannel,
} from "discord.js";

export const getRole = (guild: Guild, roleName: string): Role | null => {
  const r = guild.roles.cache.filter((role) => role.name === roleName);
  return r.first() ?? null;
};

export const getCategory = (
  guild: Guild,
  categoryName: string
): CategoryChannel | null => {
  const r = guild.channels.cache.filter(
    (channel) =>
      channel.name === categoryName &&
      channel.type === ChannelType.GuildCategory
  );
  return (r.first() as CategoryChannel) ?? null;
};

export const getChannel = (
  category: CategoryChannel,
  channelName: string,
  channelType: ChannelType
): Channel | null => {
  const r = category.children.cache.filter(
    (channel) => channel.name === channelName && channel.type === channelType
  );
  return r.first() ?? null;
};

export const readonlyPermission = (roleId: string): OverwriteResolvable => {
  return {
    id: roleId,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.CreateInstantInvite,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.UseVAD, // voice-activity-detection 音声検出
    ],
    deny: [
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles, // Manage Permissions
      PermissionsBitField.Flags.ManageWebhooks,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.SendMessagesInThreads,
      PermissionsBitField.Flags.CreatePublicThreads,
      PermissionsBitField.Flags.CreatePrivateThreads,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.UseExternalEmojis,
      PermissionsBitField.Flags.UseExternalStickers,
      PermissionsBitField.Flags.MentionEveryone,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ManageThreads,
      PermissionsBitField.Flags.SendTTSMessages,
      PermissionsBitField.Flags.UseApplicationCommands,
      // Video
      PermissionsBitField.Flags.UseEmbeddedActivities, // Voice Activities
      PermissionsBitField.Flags.PrioritySpeaker,
      PermissionsBitField.Flags.MuteMembers,
      PermissionsBitField.Flags.DeafenMembers,
      PermissionsBitField.Flags.MoveMembers,
      PermissionsBitField.Flags.ManageEvents,
    ],
  };
};

export const writerPermission = (roleId: string): OverwriteResolvable => {
  return {
    id: roleId,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.CreateInstantInvite,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.SendMessagesInThreads,
      PermissionsBitField.Flags.CreatePublicThreads,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.UseExternalEmojis,
      PermissionsBitField.Flags.UseExternalStickers,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ManageThreads,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.UseVAD, // voice-activity-detection 音声検出
    ],
    deny: [
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles, // Manage Permissions
      PermissionsBitField.Flags.ManageWebhooks,
      PermissionsBitField.Flags.CreatePrivateThreads,
      PermissionsBitField.Flags.MentionEveryone,
      PermissionsBitField.Flags.SendTTSMessages,
      PermissionsBitField.Flags.UseApplicationCommands,
      // Video
      PermissionsBitField.Flags.UseEmbeddedActivities, // Voice Activities
      PermissionsBitField.Flags.PrioritySpeaker,
      PermissionsBitField.Flags.MuteMembers,
      PermissionsBitField.Flags.DeafenMembers,
      PermissionsBitField.Flags.MoveMembers,
      PermissionsBitField.Flags.ManageEvents,
    ],
  };
};

export const noPermission = (roleId: string): OverwriteResolvable => {
  return {
    id: roleId,
    deny: [PermissionsBitField.Flags.ViewChannel],
  };
};

interface createTemplateInput {
  scenarioName: string;
  shortName: string;
  characterNames: string[];
  commonVoiceChannelNames: string[];
  scenes: string[];
  prefix: string;
}

interface createTemplateOutput {
  category: CategoryChannel;
  roles: Map<string, Role>;
  textChannels: Map<string, TextChannel>;
  voiceChannels: Map<string, VoiceChannel>;
}

/**
 * 観戦/PL/キャラクターロールの作成、一般/共通情報/観戦/キャラクター/gm管理チャンネルの作成、ボイスチャンネルの作成
 * @param guild
 * @param input
 */
export const createTemplate = async (
  guild: Guild,
  input: createTemplateInput
): Promise<createTemplateOutput> => {
  const roles = new Map<string, Role>();
  const audienceRole =
    getRole(guild, `${input.shortName}観戦`) ??
    (await guild.roles.create({
      name: `${input.shortName}観戦`,
    }));
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
      const role = await guild.roles.create({ name: `${input.prefix}${name}` });
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
    input.commonVoiceChannelNames.map(async (name) => {
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
  };
};
