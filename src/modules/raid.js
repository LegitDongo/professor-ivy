var raid = function raid(message, cmd, config, commands, con, richEmbed) {
    if (cmd[0] !== '!raid' || typeof cmd[1] === 'undefined') return;
    const request = require('request-promise'),
        fs = require('fs');

    let d = new Date();
    let m = d.getMonth();
    d.setMonth(d.getMonth() - 1);
    if (d.getMonth() == m) d.setDate(0);
    d.setHours(0, 0, 0);
    d.setMilliseconds(0);
    let requests = [];

// If the cache file doesn't exist or it's been around for longer than a month
    if (!fs.existsSync('./cache/raids.json') || fs.statSync('./cache/raids.json').mtime < d) {
        message.channel.send('Just a sec, updating cache...').then(m =>{
            m.delete(10000);
        });

        // ToDo: Put into this script to update this url every now and again
        requests.push(
            request({uri: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/raid-boss-list.json?v32', transform: (body) => {
                let bosses = [];
                let d = JSON.parse(body);
                for (let i in d) {
                    if (d[i].future === 'Off' && d[i].legacy === 'Off') {
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
            }}).catch((err) => {
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
                    .addField('CP', boss.min_cp + '-' + boss.max_cp)
                    .addField('Weather Boosted CP', boss.weather_boosted_min_cp + '-' + boss.weather_boosted_max_cp)
                    .addField('Type: ' + boss.type, typeText)
                    .addField('Raid Level', boss.level)
                    .addField('Base Catch Rate', boss.catch_rate);
                if (embedColor !== ''){
                    embed.setColor(embedColor);
                }
                message.channel.send({embed});
                break;
            }
        }
    };

    if (requests.length !== 0){
        Promise.all(requests).then(respond);
    }
    else{
        respond();
    }
};

module.exports = raid;