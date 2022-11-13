import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Fetches the warcraft log')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The report ID')),
    async execute(interaction) {
        await interaction.deferReply(); // Defer to avoid 3 second limit on response

        const id = interaction.options.getString('id') ?? 0; // Default to 0
        var report = await getReport(id);
        var log = embedReport(report, id);
        return interaction.editReply({ embeds: [log] });
    },
};

async function getAccessToken() {
    const response = await fetch('https://www.warcraftlogs.com/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa('97a1b9d9-7d4f-470d-b40d-4effbb8ebe48:7Avt7DaqTM0lQguawh5w4S99Ozsp4QYG4oVb5v3z')
        },
        body: new URLSearchParams({
            'grant_type': 'client_credentials'
        })
    });
    const data = await response.json();
    return data.access_token
}

async function sendQuery(query) {
    const accessToken = await getAccessToken();

    const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data;
}

function getBestPulls(fights) {
    var logs = {};
    for (let i in fights) {
        let fight = fights[i];

        if (fight.difficulty in logs === false) {
            logs[fight.difficulty] = {};
        }

        let bestPulls = logs[fight.difficulty];
        let name = fight.name;
        let perc = 0;
        if (!fight.kill) {
            perc = fight.fightPercentage;
            if (name in bestPulls) {
                let bestPerc = bestPulls[name];
                if (perc > bestPerc) {
                    perc = bestPerc;
                }
            }
        }
        bestPulls[name] = perc;
    }
    return logs;
}

function getBossSection(report) {
    let section = {};
    let logs = getBestPulls(report.fights);
    for (let difficulty in logs) {
        if (difficulty in section === false) {
            section[difficulty] = "";
        }
        let progress = logs[difficulty];
        for (let boss in progress) {
            let perc = progress[boss];
            let name = boss;
            if (perc > 0) {
                name += " (" + perc + "%)";
            }
            section[difficulty] += name + "\n";
        }
    }
    return section;
}

function getTopParse(rankings) {
    let topParse = '';

    for (let i in rankings) { // Fights
        let bestRank = 0;

        let fight = rankings[i];
        let roles = fight.roles;
        for (let ii in roles) { // Roles
            let role = roles[ii];
            let characters = role.characters;
            for (let iii in characters) { // Characters
                let character = characters[iii];
                let rank = character.rankPercent;
                if (rank > bestRank) {
                    bestRank = rank;
                    topParse = `${rank}% ${character.name} (${fight.encounter.name})`;
                }
            }
        }
    }

    return topParse;
}

function getParticipants(report) {
    let participants = {};

    let fights = report.rankings.data;
    for (let i in fights) {
        let fight = fights[i];
        let roles = fight.roles;
        for (let k in roles) {
            let role = roles[k];

            if (k in participants === false) {
                participants[k] = [];
                console.log("Adding array");
            }

            let characters = role.characters;
            for (let ii in characters) {
                let character = characters[ii];
                if (participants[k].includes(character.name) === false) {
                    participants[k].push(character.name);
                }
            }
        }
    }

    return participants;
}

function getParticipantSection(report) {
    let roles = {};

    let participants = getParticipants(report);
    for (let role in participants) {
        if (role in roles === false) {
            roles[role] = "";
        }

        let characters = participants[role];
        for (let i in characters) {
            roles[role] += characters[i] + '\n';
        }
    }

    return roles;
}

function embedReport(report) {
    let fields = [];

    // Boss names, percentage included if best pull was a wipe
    let bosses = getBossSection(report);
    if (4 in bosses) { // Heroic
        fields.push({ name: "Heroic", value: bosses[4] })
    }
    if (3 in bosses) { // Normal
        fields.push({ name: "Normal", value: bosses[3] })
    }

    // Best parse
    fields.push({ name: "Top parse", value: getTopParse(report.rankings.data) })

    // Participants
    let participants = getParticipantSection(report);
    var roles = Object.keys(participants);
    fields.push({ name: "Damage", value: participants[roles[2]], inline: true })
    fields.push({ name: "Healing", value: participants[roles[1]], inline: true })
    fields.push({ name: "Tanking", value: participants[roles[0]], inline: true })

    const embeddedMessage = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(report.zone.name)
        .setURL("https://www.warcraftlogs.com/reports/" + report.code + "/")
        .setDescription(formatTime(report.startTime))
        .addFields(fields)

    return embeddedMessage;
}

async function getReport(id = 0) {
    if (id == 0) {
        // Get ID
        let data = await sendQuery('{ reportData { reports(guildID: 66538, limit: 1) { data { code } } } }');
        id = data.data.reportData.reports.data[0].code
        console.log("No ID provided. Most recent log: " + id);
    }
    console.log("Fetching report with ID: " + id);
    const query = 'query{ reportData { report(code: "vjxphMbz3GqYkCng") { code title zone {name} startTime fights(killType: Encounters) { name difficulty kill fightPercentage } rankings } } }';
    const data = await sendQuery(query);
    const report = data.data.reportData.report;

    return report;
}

function formatTime(date) {
    console.log(date);
    date = new Date(date);
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(date);
}