import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { load } from './json_manager.js';
import * as events from './index/events.js'
import * as commands from './index/commands.js'

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates
	]
});
const secrets = load('secrets');

function safeHandler(handler) {
	return async (...args) => {
		try {
			await handler(...args);
		} catch (error) {
			console.error(`Error in event handler: ${error}`);
		}
	};
}

for (const event of Object.values(events)) {
	const handler = safeHandler(event.execute);

	if (event.once) {
		client.once(event.name, handler);
	} else {
		client.on(event.name, handler);
	}

	console.log(`Loaded event: ${event.name}`);
}

// Load commands
client.commands = new Collection();
for (const command of Object.values(commands)) {
	client.commands.set(command.data.name, command);
	console.log(`Loaded command: ${command.data.name}`);
}

client.login(secrets.token);