import { Interaction, SlashCommandBuilder } from "discord.js";
import { Command } from "../command";
import { modules } from "../module";

export const create: Command = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription(
      "シナリオ用の新しいカテゴリ、チャンネル、ロールを作成し権限設定まで行います"
    )
    .addStringOption((option) =>
      option
        .setName("シナリオ名")
        .setDescription("シナリオ名")
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("プレフィックス")
        .setDescription(
          "ロールなどの識別子。日付などを入れておくことを想定しています"
        )
    ),
  execute: async (interaction: Interaction) => {
    await autocomplete(interaction);
    await commandSent(interaction);
    await sceneSelected(interaction);
  },
};

const autocomplete = async (interaction: Interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName !== "create")
    return;
  const focusedOption = interaction.options.getFocused(true);

  const scenarioNames = Array.from(modules.keys());
  switch (focusedOption.name) {
    case "シナリオ名":
      await interaction.respond(
        scenarioNames
          .filter((name) => name.startsWith(focusedOption.value))
          .map((name) => ({ name, value: name }))
      );
      break;
  }
};

const commandSent = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "create") return;

  const scenarioName = interaction.options.get("シナリオ名");
  const prefix = interaction.options.get("プレフィックス");
  if (!scenarioName?.value || !prefix?.value)
    return Promise.reject("オプションの取得に失敗しました");

  await interaction.deferReply({ ephemeral: true });
  const m = modules.get(scenarioName.value.toString());
  if (m && interaction.guild && prefix) {
    await m.init(interaction.guild, prefix.value.toString());
  }
  await interaction.followUp("done!");
};

const sceneSelected = async (interaction: Interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const parsedCustomId = interaction.customId.split("\\");
  if (parsedCustomId.length !== 4 || parsedCustomId[0] !== "scene") return;

  await interaction.deferReply({ ephemeral: true });
  
  try {
    const m = modules.get(parsedCustomId[1]);
    if (m && interaction.guild) {
      const s = await m.get(
          interaction.guild,
          parsedCustomId[2],
          parsedCustomId[3]
      );
      await s.scene(interaction.values[0]);
    }
    await interaction.followUp("done!");
  } catch (e) {
    await interaction.followUp(`ERROR!: ${e}`);
  }
  
  setTimeout(() => {
    interaction.deleteReply();
  }, 10000);
};
