const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder  } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
require('dotenv').config();
const categories = require('./categories.json');
const resources = require('./resources.json');
const marketPrices = require('./market-prices.json');
const fs = require('fs');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'company') {
            interaction.deferReply();
            const name = interaction.options.getString('name');
            try {
                const url = `https://www.simcompanies.com/api/v2/companies-by-company/1/${name.replaceAll(' ', '-')}`;
                console.log(url);
                const result = await fetch(url);
                const data = await result.json();

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
                        buildings.push({name: building.name, count: 1});
                    }
                }

                let buildingString = '';
                for (const building of buildings) {
                    buildingString += `${building.name} (${building.count})\n`;
                }

                let bonus = `Production : ${data.company.productionModifier} %\n`;
                bonus += `Sales : ${data.company.salesModifier} %\n`;
                bonus += `Recreation : ${data.company.recreationBonus} %`;

                online = '';
                if (data.online === "online") {
                    online = ':green_circle:';
                } else if (data.online === "offline") {
                    online = ':red_circle:';
                } else {
                    online = ':black_circle:';
                }

                const embed = new EmbedBuilder()
                    .setColor(0x01273D)
                    .setTitle(`${name}    (${data.company.ratingBracket})    ${online}`)
                    .setURL(`https://www.simcompanies.com/fr/company/1/${name.replaceAll(' ', '%20')}`)
                    .setDescription(data.company.note ? data.company.note : 'No description')
                    .setThumbnail(data.company.logo)
                    .addFields({name: 'Value', value: dollar(data.company.history.value, 0), inline: true})
                    .addFields({
                        name: 'Building Value',
                        value: dollar(data.company.history.buildingValue),
                        inline: true
                    })
                    .addFields({name: 'Patents Value', value: dollar(data.company.history.patentsValue, 0), inline: true})
                    .addFields({name: 'Bonus', value: bonus, inline: true})
                    .addFields({name: 'Bonds Sold', value: dollar(data.company.bondsSold, 0), inline: true})
                    .addFields({
                        name: 'Bonds Sold Interest',
                        value: dollar(data.company.bondsSoldInterest, 0),
                        inline: true
                    })
                    .addFields({name: 'Buildings', value: buildingString})
                    .setTimestamp()
                    .setFooter({
                        text: 'SimCoBot',
                        iconURL: 'https://cdn.discordapp.com/app-icons/1077196058762956810/461ae54a37e3c3e4a658f58d1760bef5.png?size=256'
                    });

                await interaction.editReply({embeds: [embed]});
            } catch (error) {
                console.error(error);
                await interaction.editReply(`An error occurred while trying to get the company information: ${error}`);
            }
        }

        if (interaction.commandName === 'chart') {
            await interaction.reply('Not implemented yet');
        }

        if(interaction.commandName === 'forcemarketupdate') {
            await marketUpdate();
            await interaction.reply('Market prices updated');
        }

        if (interaction.commandName === 'market') {
            const realm = interaction.options.getString('realm');
            const category = interaction.options.getString('category');
            let options = [];
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].name === category) {
                    if (realm === 'Magnates') {
                        for (let j = 0; j < categories[i].magnates.length; j++) {
                            for (let k = 0; k < resources.length; k++) {
                                if (resources[k].db_letter === categories[i].magnates[j]) {
                                    options.push({label: resources[k].name, value: `${realm},${resources[k].db_letter}`});
                                }
                            }
                        }
                    } else {
                        for (let j = 0; j < categories[i].entrepreneurs.length; j++) {
                            for (let k = 0; k < resources.length; k++) {
                                if (resources[k].db_letter === categories[i].entrepreneurs[j]) {
                                    options.push({label: resources[k].name, value: `${realm},${resources[k].db_letter}`});
                                }
                            }
                        }
                    }
                }
            }
            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('marketSelect')
                        .setPlaceholder('Nothing selected')
                        .addOptions(options)
                );
            await interaction.reply({content: 'Select a resource', components: [row]});
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'marketSelect') {
            interaction.deferReply();
            try {
                const realm = interaction.values[0].split(',')[0] === 'Magnates' ? 0 : 1;
                const db_letter = interaction.values[0].split(',')[1];
                const url = `https://www.simcompanies.com/api/v3/market/${realm}/${db_letter}`;
                const result = await fetch(url);
                const data = await result.json();

                let resource = {};
                for (let i = 0; i < resources.length; i++) {
                    if (resources[i].db_letter.toString() === db_letter) {
                        resource = resources[i];
                    }
                }

                let fields = [];
                for (let i = 0; i < Math.min(data.length, 12); i++) {
                    let value = `Price : ${dollar(data[i].price, 3)}\n`;
                    value += `Quality : ${data[i].quality}\n`;
                    value += `Quantity : ${data[i].quantity}`
                    fields.push({name: data[i].seller.company, value: value, inline: true});
                }

                let description = 'Information unavailable.';
                if (realm === 0) {
                    if (priceAverage(marketPrices[db_letter].magnates) > data[0].price) {
                        description = 'You should buy :shopping_cart: (price below average).';
                    } else {
                        description = 'You should sell :moneybag: (price above average).';
                    }
                } else {
                    if (priceAverage(marketPrices[db_letter].entrepreneurs) > data[0].price) {
                        description = 'You should buy :shopping_cart: (price below average).';
                    } else {
                        description = 'You should sell :moneybag: (price above average).';
                    }
                }

                let pricesFields = [];
                if (realm === 0) {
                    pricesFields.push({
                        name: 'Average Price 24h',
                        value: dollar(priceAverage(marketPrices[db_letter].magnates), 3),
                        inline: true
                    });
                    pricesFields.push({
                        name: 'Min Price 24h',
                        value: dollar(priceMin(marketPrices[db_letter].magnates), 3),
                        inline: true
                    });
                    pricesFields.push({
                        name: 'Max Price 24h',
                        value: dollar(priceMax(marketPrices[db_letter].magnates), 3),
                        inline: true
                    });
                } else {
                    pricesFields.push({
                        name: 'Average Price 24h',
                        value: dollar(priceAverage(marketPrices[db_letter].entrepreneurs), 3),
                        inline: true
                    });
                    pricesFields.push({
                        name: 'Min Price 24h',
                        value: dollar(priceMin(marketPrices[db_letter].entrepreneurs), 3),
                        inline: true
                    });
                    pricesFields.push({
                        name: 'Max Price 24h',
                        value: dollar(priceMax(marketPrices[db_letter].entrepreneurs), 3),
                        inline: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(0x01273D)
                    .setTitle(`${resource.name} Market`)
                    .setDescription(description)
                    .addFields({name: '\u200B', value: '\u200B'})
                    .setURL(`https://www.simcompanies.com/market/resource/${db_letter}`)
                    .setThumbnail(`https://d1fxy698ilbz6u.cloudfront.net/static/${resource.image}`)
                    .addFields(pricesFields)
                    .addFields({name: '\u200B', value: '\u200B'})
                    .addFields(fields)
                    .setTimestamp()
                    .setFooter({
                        text: 'SimCoBot',
                        iconURL: 'https://cdn.discordapp.com/app-icons/1077196058762956810/461ae54a37e3c3e4a658f58d1760bef5.png?size=256'
                    });
                await interaction.editReply({embeds: [embed]});
            } catch (e) {
                console.log(e);
                await interaction.editReply({content: 'An error occurred.'});
            }
        }
    }
});

function dollar(n, digit) {
    if(n !== null){
        return n.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: digit,
            maximumFractionDigits: digit
        });
    } else {
        return 'N/A';
    }
}

async function marketUpdate(){
    for(let i = 0; i < resources.length; i++) {
        try {
            const magnatesUrl = `https://www.simcompanies.com/api/v3/market/0/${resources[i].db_letter}`;
            const entrepreneursUrl = `https://www.simcompanies.com/api/v3/market/1/${resources[i].db_letter}`;
            const magnatesResult = await fetch(magnatesUrl);
            const entrepreneursResult = await fetch(entrepreneursUrl);
            const magnatesData = await magnatesResult.json();
            const entrepreneursData = await entrepreneursResult.json();
            const magnatesPrice = magnatesData !== undefined && magnatesData.length > 0 ? magnatesData[0].price : null;
            const entrepreneursPrice = entrepreneursData.length !== undefined && entrepreneursData.length > 0 ? entrepreneursData[0].price : null;

            if (marketPrices[resources[i].db_letter] === undefined || marketPrices[resources[i].db_letter] === null) {
                marketPrices[resources[i].db_letter] = {name: resources[i].name, magnates: [], entrepreneurs: []};
            }

            marketPrices[resources[i].db_letter].magnates.push(magnatesPrice);
            marketPrices[resources[i].db_letter].entrepreneurs.push(entrepreneursPrice);

            if (marketPrices[resources[i].db_letter].length > 288) {
                marketPrices[resources[i].db_letter].shift();
            }

            fs.writeFile('./market-prices.json', JSON.stringify(marketPrices, null, 4), (err) => {
                if (err) throw err;
            });
        } catch (e) {
            console.log(e);
        }

        await new Promise(r => setTimeout(r, 5000));
    }
}

function priceMin(prices){
    let min = prices[0] !== null ? prices[0] : 99999;
    for(let i = 0; i < prices.length; i++){
        if(prices[i] !== null && prices[i] < min){
            min = prices[i];
        }
    }
    return min;
}

function priceMax(prices){
    let max = 0;
    for(let i = 0; i < prices.length; i++){
        if(prices[i] !== null && prices[i] > max){
            max = prices[i];
        }
    }
    return max;
}

function priceAverage(prices){
    let sum = 0;
    let count = 0;
    for(let i = 0; i < prices.length; i++){
        if(prices[i] !== null){
            sum += prices[i];
            count++;
        }
    }
    return sum / count;
}

setInterval(marketUpdate, 600000);

client.login(process.env.DISCORD_TOKEN);
