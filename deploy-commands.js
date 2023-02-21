const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'forcemarketupdate',
        description: 'Force the market update',
    },
    {
        name: 'company',
        description: 'Return the information of a company',
        options: [
            {
                name: 'name',
                description: 'The name of the company',
                type: 3,
                required: true,
            }
        ]
    },
    {
        name: 'chart',
        description: 'Return the chart of a company',
        options: [
            {
                name: 'name',
                description: 'The name of the company',
                type: 3,
                required: true,
            }
        ]
    },
    {
        name: 'market',
        description: 'Return the market information',
        options: [
            {
                name: 'realm',
                description: 'The realm of the market',
                type: 3,
                choices: [
                    {
                        name: 'Magnates',
                        value: 'Magnates',
                    },
                    {
                        name: 'Entrepreneurs',
                        value: 'Entrepreneurs',
                    }
                ],
                required: true,
            },
            {
                name: 'category',
                description: 'The category of the market',
                type: 3,
                choices: [
                    {
                        name: 'Agriculture',
                        value: 'Agriculture',
                    },
                    {
                        name: 'Food',
                        value: 'Food',
                    },
                    {
                        name: 'Construction',
                        value: 'Construction',
                    },
                    {
                        name: 'Fashion',
                        value: 'Fashion',
                    },
                    {
                        name: 'Energy',
                        value: 'Energy',
                    },
                    {
                        name: 'Electronics',
                        value: 'Electronics',
                    },
                    {
                        name: 'Automotive',
                        value: 'Automotive',
                    },
                    {
                        name: 'Aerospace',
                        value: 'Aerospace',
                    },
                    {
                        name: 'Resources',
                        value: 'Resources',
                    },
                    {
                        name: 'Research',
                        value: 'Research',
                    }
                ],
                required: true,
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