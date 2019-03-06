var forcedCheck = function forcedCheck() {
    // Check required parameters
    if (typeof ivy.config.forcedChannelId !== 'undefined' && ivy.config.forcedChannelId !== '') {

        (function checkForced() {
            ivy.request({
                'url': 'https://pgorelease.nianticlabs.com/plfe/version',
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                }
            }).then((e) => {
                if (!ivy.fs.existsSync('./cache/main.json')) {
                    ivy.fs.writeFile('./cache/main.json', JSON.stringify({'forced': e.substr(2)}), (err) => {
                        if (err) {
                            console.log(err);
                            // Need to move from message to direct channel link
                            ivy.client.channels.get(ivy.config.forcedChannelId)
                                .send('Error saving main cache file. Check log for more details.');
                        }
                    });
                    return 0;
                }
                ivy.fs.readFile('./cache/main.json', (err, data) => {
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
                        ivy.client.channels.get(ivy.config.forcedChannelId)
                            .send('New version forced! We are now on version ' + ver +
                                '\nThere will be some delay in getting everything set back up.' +
                                '\nYour patience is appreciated.');
                        jsonData.forced = ver;
                        write = true;
                    }
                    else if (parseInt(jsonData.forced.replace(/\./g, '')) > verInt){
                        console.log('Forced version reverted! Back on version ' + ver);
                        // Message to channel about reversion
                        ivy.client.channels.get(ivy.config.forcedChannelId)
                            .send('Forced version reverted! Silly Niantic :)' +
                                    '\nWe are now on version ' + ver +
                                    '\nThings shall resume working in a bit.');
                        jsonData.forced = ver;
                        write = true;
                    }
                    if (write){
                        ivy.fs.writeFile('./cache/main.json', JSON.stringify(jsonData), (err) => {
                            if (err) {
                                console.log(err);
                                ivy.client.channels.get(ivy.config.forcedChannelId)
                                    .send('Error saving main cache file. Check log for more details.');
                            }
                        });
                    }
                });
            });
            setTimeout(checkForced, 300000);
        })();
    }
};

module.exports = forcedCheck;