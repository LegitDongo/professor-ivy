var raid = function raid(message, cmd, richEmbed) {
    if (cmd[0] !== '!raid' || typeof cmd[1] === 'undefined') return;
    if (typeof ivy.cheerio === 'undefined') {
        ivy.cheerio = require('cheerio');
    }

    let date = new Date();
    let month = date.getMonth();
    date.setMonth(date.getMonth() - 1);
    if (date.getMonth() === month) date.setDate(0);
    date.setHours(0, 0, 0);
    date.setMilliseconds(0);
    let requests = [];
    let updateMessage = null;

    // If the cache file doesn't exist or it's been around for longer than a month
    if (!ivy.fs.existsSync('./cache/raids.json') || ivy.fs.statSync('./cache/raids.json').mtime < date) {
        updateMessage = message.channel.send('Just a sec, updating cache...');

        async function getStuff(){
            let headers = {
                'url': ivy.strings[1] + new Date().getTime(),
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                }
            };

            let list = JSON.parse(await ivy.request(headers));

            // Get main boss page
            let bossHtml = await
                ivy.request({...headers, ...{'url':list.filter(e => e.title === ivy.strings[2])[0].url}});
            let bosses = [];
            let d = JSON.parse(bossHtml);
            for (let i in d) {
                let id = d[i].image.split('href="/pokemon/')[1].split('"')[0];
                if (/-/.test(id)){
                    id = id.split('-')[0];
                }

                let formNameApproved = false;
                let formIdApproved = false;
                let title = d[i].title_plain;
                for(let i in ivy.assets.forms){
                    if (parseInt(i) === parseInt(id) || i === 'all'){
                        for(let j in ivy.assets.forms[i]){
                            let test = new RegExp(ivy.assets.forms[i][j], 'gi');
                            if (test.test(title)){
                                formNameApproved = ivy.assets.forms[i][j];
                                formIdApproved = j;
                                title = title.replace(test, '').replace(/(\(|\)|forme|form)/gi, '').trim();
                                break;
                            }
                        }
                        break;
                    }
                }

                let bossObj = {
                    "id": id,
                    "level": d[i].tier.split('raid-tier-stars">')[1].charAt(0),
                    "name": title,
                    "link": ivy.strings[0].slice(0, -1) + d[i].title.split('href="')[1].split('"')[0],
                    "image": `https://monsterimages.tk/v1.5/regular/monsters/${id.padStart(3, '0')}_${formIdApproved !== false ? formIdApproved : '000'}.png`,
                    "boss_cp": d[i].cp,
                    "type": d[i].type.replace(/ /, '').replace(/,/, '/'),
                    "min_cp": d[i].min_cp,
                    "weather_boosted_min_cp": d[i].weather_min,
                    "max_cp": d[i].max_cp,
                    "weather_boosted_max_cp": d[i].weather_max,
                    "catch_rate": d[i].catch_rate
                };
                if (formNameApproved !== false){
                    bossObj['form'] = formNameApproved;
                }
                bosses.push(bossObj);
            }

            for(let i in bosses){
                // Get specific boss page
                let bossPageHtml = await ivy.request({...headers, ...{'url': bosses[i].link}});
                let $ = ivy.cheerio.load(bossPageHtml);
                let $anchor = $('.view-raid-boss-counter-guide-link a').attr('href');

                if (typeof $anchor === 'undefined' || $anchor === ''){
                    console.log(`Raid boss counter guide link not found on ${bosses[i].name} raid boss page. Skipping.`);
                    continue;
                }
                // Get boss counters page
                let bestCountersHtml = await ivy.request({...headers, ...{
                        'url': ivy.strings[0].slice(0, -1) + $anchor
                    }});
                $ = ivy.cheerio.load(bestCountersHtml);
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

            ivy.fs.writeFile('./cache/raids.json', JSON.stringify(bosses), (err) => {
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
                bosses = JSON.parse(ivy.fs.readFileSync('./cache/raids.json'));
            }
            types = JSON.parse(ivy.fs.readFileSync('./cache/types.json'));
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

        let form = null, monster = null;
        let command = cmd.join(' ').toLowerCase().split(' ');
        command.splice(0,1);
        monster = command.splice(-1)[0];
        form = command.filter(x => !x.includes("form")).join(" ");

        // 1. if no form is requested then look for an object with no form or the "normal" form
        // 2. if a form was requested, search for the specific form | name key
        let possibleBosses = [];
        if (form === null || form === '') {
            possibleBosses = bosses.filter(item => item.name.toLowerCase().indexOf(monster) !== -1);
            if (possibleBosses.length > 1){
                possibleBosses = possibleBosses.filter(
                    item => typeof item.form === 'undefined' || item.form === 'Normal');
            }
        }
        else{
            possibleBosses = bosses.filter(item =>
                // Make sure we have a form
                typeof item.form !== 'undefined' &&
                // Check name
                (item.name.toLowerCase().indexOf(monster) !== -1 || item.name.toLowerCase().indexOf(monster) !== -1) &&
                // Check form
                (item.form.toLowerCase().indexOf(form) !== -1 || item.form.toLowerCase().indexOf(form) !== -1))
        }

        if (possibleBosses.length === 0){
            return;
        }
        let boss = possibleBosses[0];

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
            if (type.name.includes('/')){
                mainType = type.name.split('/')[0];
            }
            if (typeof ivy.assets['typeColors'][mainType.toLowerCase()] !== 'undefined'){
                embedColor = ivy.assets['typeColors'][mainType.toLowerCase()];
            }
        }
        else {
            message.channel.send('Type not found in types array. Please check data.').then(m => {
                m.delete(10000);
            });
            return;
        }
        delete type.name;
        let typeArr = [];
        for (let i in type) {
            let modifier = parseFloat(i.replace(/%/, ''));
            if (modifier < 100){
                modifier = modifier * -1;
            }
            typeArr.push({
                'id': modifier,
                'text': (modifier > 100 ? '+' : '-') + ' ' + i + ': ' + type[i].replace(/,/g, ', ')
            });
        }
        typeArr = typeArr.sort(function(a, b){
            if (a.id < b.id) return 1;
            if (a.id > b.id) return -1;
            return 0;
        }).map(function(e){
            return e.text;
        });
        const embed = richEmbed
            .setTitle(boss.name + (typeof boss.form !== 'undefined' ? ` | ${boss.form}` : ''))
            .setThumbnail(boss.image)
            .setURL(boss.link)
            .addField('Raid Info', `**Tier ${boss.level}** | ${boss.boss_cp} CP`)
            .addField('CP', boss.min_cp + '-' + boss.max_cp + ' | Weather boosted: ' +
                boss.weather_boosted_min_cp + '-' + boss.weather_boosted_max_cp)
            .addField('Type: ' + boss.type, '```diff\n' + typeArr.join('\n') + '\n```')
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