var pogonews = function pogonews(client, config) {
    // Check required parameters
    if (typeof config.newsChannelId !== 'undefined' && config.newsChannelId !== '') {
        let request = require('request-promise');
        let fs = require('fs');
        let cheerio = require('cheerio');
        (function pogoNewsGet() {
            request({
                'url': 'https://pokemongolive.com/en/post',
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                }
            }).then((e) => {
                let $ = cheerio.load(e);
                let newsPosts = [];
                $('.post-list a').each(function(){
                    newsPosts.push($(this).attr('href'));
                });
                if (!fs.existsSync('./cache/main.json')) {
                    fs.writeFile('./cache/main.json', JSON.stringify({'news': newsPosts}), (err) => {
                        if (err) {
                            console.log(err);
                            // Need to move from message to direct channel link
                            client.channels.get(config.newsChannelId)
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
                    let write = false;
                    if (typeof jsonData.news === 'undefined'){
                        console.log('News list not in main cache file. Adding.');
                        jsonData.news = newsPosts;
                        write = true;
                    }
                    else if(newsPosts.length > jsonData.news.length){
                        for(let i = 0; i < newsPosts.length - jsonData.news.length; i++){
                            console.log('New news detected! Posting to news channel: '+newsPosts[i]);
                            client.channels.get(config.newsChannelId)
                                .send('https://pokemongolive.com'+newsPosts[i]);
                        }
                        jsonData.news = newsPosts;
                        write = true;
                    }
                    if (write){
                        fs.writeFile('./cache/main.json', JSON.stringify(jsonData), (err) => {
                            if (err) {
                                console.log(err);
                                client.channels.get(config.newsChannelId)
                                    .send('Error saving main cache file. Check log for more details.');
                            }
                        });
                    }
                });
            });
            setTimeout(pogoNewsGet, 300000);
        })();
    }
};

module.exports = pogonews;