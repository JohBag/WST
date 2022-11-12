import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import config from './config.json' assert { type: "json"};
import * as url from 'url';
import * as events from './index/events.js'
import * as commands from './index/commands.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Load events
for (const event of Object.values(events)) {
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Load commands
client.commands = new Collection();
for (const command of Object.values(commands)) {
	client.commands.set(command.data.name, command);
}

client.login(config.token);