const { Client, GatewayIntentBits, EmbedBuilder  } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
require('dotenv').config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'company') {
        const name = interaction.options.getString('name');
        try {
            //retrieve company information
            const url = `https://www.simcompanies.com/api/v2/companies-by-company/1/${name.replaceAll(' ', '-')}`;
            console.log(url);
            const result = await fetch(url);
            const data = await result.json();

            //build building string
            let buildings = [];
            for (const building of data.buildings) {
                let i;
                for (i = 0; i < buildings.length; i++) {
                    if (buildings[i].name === building.name) {
                        buildings[i].count++;
                        break;
                    }
                }
                if (i === buildings.length) {
                    buildings.push({ name: building.name, count: 1 });
                }
            }

            let buildingString = '';
            for (const building of buildings) {
                buildingString += `${building.name} (${building.count})\n`;
            }

            //build bonus string
            let bonus = `Production : ${data.company.productionModifier} %\n`;
            bonus += `Sales : ${data.company.salesModifier} %\n`;
            bonus += `Recreation : ${data.company.recreationBonus} %`;

            //online status
            online = '';
            if (data.online === "online") {
                online = ':green_circle:';
            } else if (data.online === "offline") {
                online = ':red_circle:';
            } else {
                online = ':black_circle:';
            }

            //build embed
            const embed = new EmbedBuilder()
                .setColor(0x01273D)
                .setTitle(`${name}    (${data.company.ratingBracket})    ${online}`)
                .setURL(`https://www.simcompanies.com/fr/company/1/${name.replaceAll(' ', '%20')}`)
                .setDescription(data.company.note ? data.company.note : 'No description')
                .setThumbnail(data.company.logo)
                .addFields({ name: 'Value', value: dollar(data.company.history.value), inline: true })
                .addFields({ name: 'Building Value', value: dollar(data.company.history.buildingValue), inline: true })
                .addFields({ name: 'Patents Value', value: dollar(data.company.history.patentsValue), inline: true })
                .addFields({ name: 'Bonus', value: bonus, inline: true })
                .addFields({ name: 'Bonds Sold', value: dollar(data.company.bondsSold), inline: true })
                .addFields({ name: 'Bonds Sold Interest', value: dollar(data.company.bondsSoldInterest), inline: true })
                .addFields({ name: 'Buildings', value: buildingString })
                .setTimestamp()
                .setFooter({ text: 'SimCoBot', iconURL: 'https://cdn.discordapp.com/app-icons/1077196058762956810/461ae54a37e3c3e4a658f58d1760bef5.png?size=256' });

            //send embed
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply(`An error occurred while trying to get the company information: ${error}`);
        }
    }
});

function dollar(n) {
    return n.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
}

client.login(process.env.DISCORD_TOKEN);