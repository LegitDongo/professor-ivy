var whereIs = function whereIs(message, cmd, config, commands, con, richEmbed) {
    let messageLower = message.content.toLowerCase();
    let messageContent = messageLower.split('where is ');
    if (!messageLower.startsWith('where is ') || messageContent.length <= 1) return;
    let fs = require('fs');
    messageContent = message.content.slice(9);
    let getCacheData = (find) => {
        if (fs.existsSync('./cache/whereis.json')){
            let whereIsFile = JSON.parse(fs.readFileSync('./cache/whereis.json'));
            for(let i in whereIsFile){
                if (slugify(whereIsFile[i].name) === slugify(find)){
                    return whereIsFile[i];
                }
            }
        }
        else{
            console.log('Cache file doesn\'t exist');
        }
        return false;
    };
    let compileData = (data) => {
        if (!data) return false;
        richEmbed.setTitle((typeof data.type !== 'undefined' ? data.type.toProperCase() + ' | ' : '') + data.name);
        // Monocle databases don't include a description for forts
        if (typeof data.description !== 'undefined' && data.description !== '')
            richEmbed.setDescription(data.description);
        if (data.thumbnail !== 'undefined')
            richEmbed.setThumbnail(data.thumbnail);
        richEmbed.setURL(`http://maps.google.com/maps?q=${data.latitude},${data.longitude}`);
        if (typeof config.googleMapsAPIKey !== 'undefined' && config.googleMapsAPIKey !== '')
            richEmbed.setImage(`http://maps.googleapis.com/maps/api/staticmap`+
                `?center=${data.latitude},${data.longitude}&zoom=16&size=400x300`+
                `&markers=color:red%7C${data.latitude},${data.longitude}&key=${config.googleMapsAPIKey}`);
        return richEmbed;
    };
    let sendMessage = (embed) => {
        if (!embed){
            message.react('🤷');
            return;
        }
        message.channel.send(embed).then(m => {
            m.delete(600000); // 10 minutes
        });
    };
    // Check if database is available/exists
    if (con && typeof config.whereIsDatabaseType !== 'undefined' && config.whereIsDatabaseName !== 'undefined'){
        // If the time between now and the cache file isn't more than the allotted cache refresh time
        if ((typeof config.whereIsCacheRefresh === 'undefined' || !Number.isInteger(config.whereIsCacheRefresh) ||
            !config.whereIsCacheRefresh > 0) && fs.existsSync('./cache/whereis.json') &&
            config.whereIsCacheRefresh >= Math.abs(fs.statSync('./cache/whereis.json').mtime - new Date()) / 60000){
            sendMessage(compileData(getCacheData(messageContent)));
            return true;
        }
        // Check if the user config is valid and we have something to query off of
        let queryJson = JSON.parse(fs.readFileSync('./src/assets/whereIsTypes.json'));
        let type = false;
        for (let i in queryJson) {
            if (queryJson[i].name === config.whereIsDatabaseType){
                type = queryJson[i];
                break;
            }
        }
        if (!type){
            console.log('Invalid type in the whereIsDatabaseType config field.');
            return false;
        }
        let doneQueries = 0;
        let allData = [];
        let writeData = (data) => {
            allData = allData.concat(data);
            if (type.queries.length < doneQueries){
                doneQueries++;
                return false;
            }
            fs.writeFileSync('./cache/whereis.json', JSON.stringify(allData));
            return true;
        };
        for(let q in type.queries) {
            con.query(type.queries[q].query.replace(/\{dbname\}/g, config.whereIsDatabaseName), (err, results) => {
                if (err) {
                    console.log(err);
                    return false;
                }
                if (writeData(results)) {
                    sendMessage(compileData(getCacheData(messageContent)));
                }
            });
        }
    }
    else{
        // Look in cache
        sendMessage(compileData(getCacheData(messageContent)));
    }
};

module.exports = whereIs;