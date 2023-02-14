import { Interaction, SlashCommandBuilder } from "discord.js";
import { Command } from "../command";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("pongを返します"),
  execute: async (interaction: Interaction): Promise<void> => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "ping")
      return;
    await interaction.reply({ content: "pong!", ephemeral: true });
  },
};
