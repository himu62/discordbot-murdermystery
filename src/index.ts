import {Client, Events, GatewayIntentBits, REST, Routes} from "discord.js";
import {config} from "./config";
import {ping} from "./commands/ping";
import {create} from "./commands/create";
import {Command} from "./command";

(async () => {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    client.once(Events.ClientReady, async (ev) => {
        const guild = await ev.guilds.fetch(config.guildId);
        console.log(`bot is ready as ${ev.user.username} on ${guild.name}`);
    });

    const commands = new Array<Command>();
    commands.push(ping, create);

    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            commands.forEach((command) => command.execute(interaction));
        } catch (e) {
            console.error(e);
        }
    });

    const rest = new REST({version: "10"}).setToken(config.token);
    await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        {
            body: commands.map((command) => command.data.toJSON()),
        }
    );

    await client.login(config.token);
})();
