var pogonews = function pogonews() {
    // Check required parameters
    if (typeof ivy.config.newsChannelId !== 'undefined' && ivy.config.newsChannelId !== '') {
        if (typeof ivy.cheerio === 'undefined') {
            ivy.cheerio = require('cheerio');
        }
        (function pogoNewsGet() {
            ivy.request({
                'url': 'https://pokemongolive.com/en/post',
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                }
            }).then((e) => {
                let $ = ivy.cheerio.load(e);
                let newsPosts = [];
                $('.post-list a').each(function(){
                    newsPosts.push($(this).attr('href'));
                });
                if (!ivy.fs.existsSync('./cache/main.json')) {
                    ivy.fs.writeFile('./cache/main.json', JSON.stringify({'news': newsPosts}), (err) => {
                        if (err) {
                            console.log(err);
                            // Need to move from message to direct channel link
                            ivy.client.channels.get(ivy.config.newsChannelId)
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
                    let write = false;
                    if (typeof jsonData.news === 'undefined'){
                        console.log('News list not in main cache file. Adding.');
                        jsonData.news = newsPosts;
                        write = true;
                    }
                    else if(newsPosts.length > jsonData.news.length){
                        for(let i = 0; i < newsPosts.length - jsonData.news.length; i++){
                            console.log('New news detected! Posting to news channel: '+newsPosts[i]);
                            ivy.client.channels.get(ivy.config.newsChannelId)
                                .send('https://pokemongolive.com'+newsPosts[i]);
                        }
                        jsonData.news = newsPosts;
                        write = true;
                    }
                    if (write){
                        ivy.fs.writeFile('./cache/main.json', JSON.stringify(jsonData), (err) => {
                            if (err) {
                                console.log(err);
                                ivy.client.channels.get(ivy.config.newsChannelId)
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