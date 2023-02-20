const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'company',
        description: 'Return the information of a company',
        options: [
            {
                name: 'name',
                description: 'The name of the company',
                type: 3,
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENTID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();