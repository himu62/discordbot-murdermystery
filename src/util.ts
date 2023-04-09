import {
  CategoryChannel,
  Channel,
  ChannelType,
  Guild,
  Message,
  OverwriteResolvable,
  PermissionsBitField,
  Role,
  TextChannel,
} from "discord.js";
import { config } from "./config";
import { join } from "node:path";

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

export const FILE = (dirname: string) => {
  return (path: string) => {
    return join(dirname, "files", path);
  };
};

export const sendInfoToIndividualChannel = async (
  channels: TextChannel[]
): Promise<Message[]> => {
  return Promise.all(
    channels.map(async (ch) => {
      return await ch.send({
        content: `=====================================================================
ここは、他のプレイヤーには見えない個人用チャンネルです。
メモや思考整理、考えていることを吐き出すなど、自由にお使いください。
（他チャンネルへの誤爆には注意してください）
ゲーム終了時、他のプレイヤーに公開されます。

何か聞きたいことがある場合には、 <@${config.gmUserId}> をつけて送ってください。
（このbotにメンションしてもGMに通知されません。メンション先の間違いに気をつけてください）
=====================================================================`,
      });
    })
  );
};
