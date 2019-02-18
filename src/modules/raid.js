var raid = function raid(message, cmd, config, commands, con, richEmbed) {
    if (cmd[0] !== '!raid' || typeof cmd[1] === 'undefined') return;
    const request = require('request-promise'),
        fs = require('fs'),
        cheerio = require('cheerio');

    let d = new Date();
    let m = d.getMonth();
    d.setMonth(d.getMonth() - 1);
    if (d.getMonth() == m) d.setDate(0);
    d.setHours(0, 0, 0);
    d.setMilliseconds(0);
    let requests = [];
    let updateMessage = null;

// If the cache file doesn't exist or it's been around for longer than a month
    if (!fs.existsSync('./cache/raids.json') || fs.statSync('./cache/raids.json').mtime < d) {
        updateMessage = message.channel.send('Just a sec, updating cache...');

        async function getStuff(){
            let headers = {
                'url': 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/raid-boss-list.json?v33',
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                }
            };

            // Get main boss page
            let bossHtml = await request(headers);
            let bosses = [];
            let d = JSON.parse(bossHtml);
            for (let i in d) {
                let id = d[i].image.split('href="/pokemon/')[1].split('"')[0];
                bosses.push({
                    "id": id,
                    "level": d[i].tier.split('raid-tier-stars">')[1].charAt(0),
                    "name": d[i].title.split('hreflang="en">')[1].split('</')[0],
                    "link": 'https://pokemongo.gamepress.gg' + d[i].title.split('href="')[1].split('"')[0],
                    "image": 'https://monsterimages.tk/v1.5/regular/monsters/' + id + '_000.png', // 'https://pokemongo.gamepress.gg' + d[i].image.split('src="')[1].split('"')[0],
                    "boss_cp": d[i].cp,
                    "type": d[i].type.replace(/ /, '').replace(/,/, '/'),
                    "min_cp": d[i].min_cp,
                    "weather_boosted_min_cp": d[i].weather_min,
                    "max_cp": d[i].max_cp,
                    "weather_boosted_max_cp": d[i].weather_max,
                    "catch_rate": d[i].catch_rate
                });
            }

            for(let i in bosses){
                // Get specific boss page
                let bossPageHtml = await request({...headers, ...{'url': bosses[i].link}});
                let $ = cheerio.load(bossPageHtml);
                let $anchor = $('.view-raid-boss-counter-guide-link a').attr('href');

                if (typeof $anchor === 'undefined' || $anchor === ''){
                    console.log(`Raid boss counter guide link not found on ${bosses[i].name} raid boss page. Skipping.`);
                    continue;
                }
                // Get boss counters page
                let bestCountersHtml = await request({...headers, ...{
                        'url': 'https://pokemongo.gamepress.gg' + $anchor
                    }});
                $ = cheerio.load(bestCountersHtml);
                let $bossRows = $('.field--name-field-raid-boss-counters-list table');
                let $bossCount = $bossRows.length;
                let counters = [];
                for(let bc=0; bc < $bossCount; bc++){
                    let $thisBossRow = $($bossRows[bc]);
                    let quickMoves = $thisBossRow.find('.raid-pokemon-quick-move a').map(function() {
                        return $(this).text();
                    }).toArray().join(' | ');
                    let chargeMoves = $thisBossRow.find('.raid-pokemon-charge-move a').map(function() {
                        return $(this).text();
                    }).toArray().join(' | ');
                    counters.push({
                        'name': $thisBossRow.find('.field--name-title').text().trim(),
                        'charge': chargeMoves,
                        'quick': quickMoves
                    });
                }
                bosses[i].counters = counters;
            }

            fs.writeFile('./cache/raids.json', JSON.stringify(bosses), (err) => {
                if (err) {
                    console.log(err);
                    message.channel.send('Error saving raids cache file. See log for whole error').then(m => {
                        m.delete(10000);
                    });
                }
            });
            return bosses;
        }

        requests.push(
            getStuff().catch(err => {
                console.log(err.message);
                message.channel.send('Error getting data. See log for full details.').then(m => {
                    m.delete(10000);
                });
            })
        );
    }

    let respond = (bosses = []) => {

        /**
         * Require all of the necessary files
         */

        if (bosses.length === 1) bosses = bosses[0];
        let types = null;
        try {
            if (bosses.length === 0) {
                bosses = JSON.parse(fs.readFileSync('./cache/raids.json'));
            }
            types = JSON.parse(fs.readFileSync('./cache/types.json'));
        }
        catch (e) {
            console.log(e.message);
            message.channel.send('Error attempting to load one of the required cache files. See log for whole error').then(m => {
                m.delete(10000);
            });
            return 0;
        }


        /**
         * Respond to the request
         **/

        cmd[1] = cmd[1].toLowerCase();
        for (let i in bosses) {
            if (bosses[i].name.toLowerCase() === cmd[1]) {
                let boss = bosses[i];
                let type = types.filter((obj) => {
                    let a = obj.name.toLowerCase();
                    let b = boss.type.toLowerCase();
                    if (a === b) return true;
                    a = a.split('/');
                    b = b.split('/');
                    if (a.length > 1 && b.length > 1) {
                        if (a[0] === b[1] && a[1] === b[0]) {
                            return true;
                        }
                    }
                    return false;
                });
                let embedColor = '';
                if (typeof type[0] !== 'undefined') {
                    type = type[0];
                    let mainType = type.name;
                    if (type.name.includes('/')) mainType = type.name.split('/')[0];
                    if (typeof assets['typeColors'][mainType.toLowerCase()] !== 'undefined') embedColor = assets['typeColors'][mainType.toLowerCase()];
                }
                else {
                    message.channel.send('Type not found in types array. Please check data.').then(m => {
                        m.delete(10000);
                    });
                    break;
                }
                delete type.name;
                let typeText = '```diff\n';
                let first = true;
                for (let i in type) {
                    if (!first) {
                        typeText += '\n';
                    }
                    let modifier = parseFloat(i.replace(/x/, '')) > 1 ? '+' : '-';
                    typeText += modifier + ' ' + i + ': ' + type[i].replace(/,/g, ', ');
                    first = false;
                }
                typeText += '\n```';
                const embed = richEmbed
                    .setTitle(boss.name)
                    .setThumbnail(boss.image)
                    .setURL(boss.link)
                    .addField('Raid Info', `**Tier ${boss.level}** | ${boss.boss_cp} CP`)
                    .addField('CP', boss.min_cp + '-' + boss.max_cp + ' | Weather boosted: ' +
                        boss.weather_boosted_min_cp + '-' + boss.weather_boosted_max_cp)
                    .addField('Type: ' + boss.type, typeText)
                    .addField('Base Catch Rate', boss.catch_rate);
                if (typeof boss.counters !== 'undefined' && boss.counters.length !== 0){
                    let bossCounters = '';
                    let count = 1;
                    for(let i in boss.counters){
                        if (i > 6){
                            break;
                        }
                        bossCounters += `#${count} **${boss.counters[i].name}** - ` +
                            `${boss.counters[i].quick} / ${boss.counters[i].charge}`+( i >= 6 ? '' : '\n' );
                        count++;
                    }
                    embed.addField('Counters', bossCounters);
                }
                if (embedColor !== ''){
                    embed.setColor(embedColor);
                }
                message.channel.send({embed});
                break;
            }
        }
    };

    if (requests.length !== 0){
        Promise.all(requests).then(respond).then(function(){
            if (updateMessage !== null) {
                updateMessage.then(m => m.delete());
            }
        });
    }
    else{
        respond();
    }
};

module.exports = raid;