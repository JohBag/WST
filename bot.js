import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { load } from './json_manager.js';
import log from './common/logger.js';
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

// Load events
for (const event of Object.values(events)) {
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
	log(`Loaded event: ${event.name}`);
}
// Load commands
client.commands = new Collection();
for (const command of Object.values(commands)) {
	client.commands.set(command.data.name, command);
	log(`Loaded command: ${command.data.name}`);
}

client.login(secrets.token);