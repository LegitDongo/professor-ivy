//command list requests
var commands = function commands(message, cmd) {
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if ((cmd[0] === '!ivy' && (cmd[1] === 'cmd' || cmd[1] === 'commands')) || (cmd[0] === '!help' && typeof cmd[1] === 'undefined')) {
        if (cmd[2] && !isNaN(cmd[2]) && parseInt(cmd[2]) > 0) {
            //gives 11 results?
            ivy.con.query('SELECT term FROM responses LIMIT ?,?', [(cmd[2] - 1) * 10, 10], (err, results) => {
                if (err) ivy.appexit(err);
                let reply = '';
                let first = true;
                if (results[0]) {
                    for (let i in results) {
                        if (!first) {
                            reply += '\n';
                        }
                        reply += results[i].term;
                        first = false;
                    }
                    message.channel.send('```\n' + reply + '\n```').then(m => {
                        m.delete(50000);
                    });
                    message.delete(0);
                }
            });
        }
        else {
            let reply = '';
            if (message.member.hasPermission("ADMINISTRATOR")) {
                reply = '---ADMIN---\n' + Object.keys(ivy.commands.admin).join('\n');
            }
            let anyone = Object.keys(ivy.commands.all).join('\n');
            if (anyone !== '') {
                reply += (reply !== '' ? '\n\n' : '') + '---BOT COMMANDS---\n' + anyone;
            }
            if (reply !== '') {
                reply += '\n\n';
            }
            reply += '---OTHER---\n';
            reply += 'use "!ivy cmd {page_num}" to see a paged list of these commands';
            message.channel.send('```\n' + reply + '\n```').then(m => {
                m.delete(50000);
            });
            message.delete(0);
        }
    }
};

module.exports = commands;