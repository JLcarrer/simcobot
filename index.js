const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
require('dotenv').config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'company') {
        const name = interaction.options.getString('name').replace(' ', '-');
        try {
            const url = `https://www.simcompanies.com/api/v2/companies-by-company/1/${name}`;
            const result = await fetch(url);
            const data = await result.json();
            await interaction.reply(`Company value : ${data.company.history.value}`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`Sorry, the company you specified does not exist.`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);