var forcedCheck = function forcedCheck(client, config, commands, con) {
    // Check required parameters
    if (typeof config.forcedChannelId !== 'undefined' && config.forcedChannelId !== '') {
        let request = require('request-promise');
        let fs = require('fs');
        (function checkForced() {
            request('https://pgorelease.nianticlabs.com/plfe/version').then((e) => {
                if (!fs.existsSync('./cache/main.json')) {
                    fs.writeFile('./cache/main.json', JSON.stringify({'forced': e.substr(2)}), (err) => {
                        if (err) {
                            console.log(err);
                            // Need to move from message to direct channel link
                            client.channels.get(config.forcedChannelId)
                                .send('Error saving main cache file. Check log for more details.');
                        }
                    });
                    return 0;
                }
                fs.readFile('./cache/main.json', (err, data) => {
                    if (err) {
                        console.log(err);
                        return 1;
                    }
                    let jsonData = JSON.parse(data);
                    let ver = e.substr(2);
                    let verInt = parseInt(ver.replace(/\./g, ''));
                    let write = false;
                    if (typeof jsonData.forced === 'undefined'){
                        console.log('Forced version not in main cache file. Adding.');
                        jsonData.forced = ver;
                        write = true;
                    }
                    else if (parseInt(jsonData.forced.replace(/\./g, '')) < verInt) {
                        console.log('New version forced! Now on version ' + ver);
                        // Message to channel about new force
                        client.channels.get(config.forcedChannelId)
                            .send('New version forced! We are now on version ' + ver +
                                '\nThere will be some delay in getting everything set back up.' +
                                '\nYour patience is appreciated.');
                        jsonData.forced = ver;
                        write = true;
                    }
                    else if (parseInt(jsonData.forced.replace(/\./g, '')) > verInt){
                        console.log('Forced version reverted! Back on version ' + ver);
                        // Message to channel about reversion
                        client.channels.get(config.forcedChannelId)
                            .send('Forced version reverted! Silly Niantic :)' +
                                    '\nWe are now on version ' + ver +
                                    '\nThings shall resume working in a bit.');
                        jsonData.forced = ver;
                        write = true;
                    }
                    if (write){
                        fs.writeFile('./cache/main.json', JSON.stringify(jsonData), (err) => {
                            if (err) {
                                console.log(err);
                                client.channels.get(config.forcedChannelId)
                                    .send('Error saving main cache file. Check log for more details.');
                            }
                        });
                    }
                });
            });
            setTimeout(checkForced, 3600000); // Exactly 1 hour
        })();
    }
};

module.exports = forcedCheck;