//channel cleaning
//Note: cannot delete messages older than 14 days old
var channelclean = function channelclean(message){
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if (message.content.startsWith('!clean')){
        for(let i in ivy.config.cleanableChannelsIds) {
            if (ivy.config.cleanableChannelsIds[i] === message.channel.id) {
                message.channel.fetchMessages().then(messages => message.channel.bulkDelete(messages));
            }
        }
    }
};

module.exports = channelclean;