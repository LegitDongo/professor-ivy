var commands = function commands(message, cmd, config, commands, con){
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if (message.content.startsWith('.cmd') && con) {
        if (/"/.test(message.content)) {
            //grab all items with opening/closing double quotes
            let match = message.content.match(/"(.*?)"/g);
            let j = 2;
            let cmd2 = [];
            cmd2[0] = cmd[0];
            cmd2[1] = cmd[1];
            //after cmd[1], remove quotes from string and put there
            for (let i in match) {
                cmd2[j] = match[i].substr(1, match[i].length - 2);
                j++;
                cmd = cmd2;
            }
            // .cmd {add|rm|update|etc} {arg2} --- required
            if (cmd[1] && cmd[2]) {
                let reply = '';
                // .cmd add {arg1} {arg2}
                if (cmd[1] === 'add' && cmd[3]) {
                    con.query('INSERT INTO responses(term, response, Creator) VALUES(?, ?, ?)', [cmd[2], cmd[3], message.author.id], (err, results, fields) => {
                        if (err) appexit(err);
                        reply = `${ cmd[2] } added`;
                        message.channel.send(reply).then(m => {
                            m.delete(10000);
                        });
                        message.delete(0);
                    });
                }
                // .cmd rm {arg1}
                else if (cmd[1] === 'rm') {
                    con.query('DELETE FROM responses WHERE term = ?', cmd[2], (err, results, fields) => {
                        if (err) appexit(err);
                        reply = `${ cmd[2] } removed`;
                        message.channel.send(reply).then(m => {
                            m.delete(10000);
                        });
                        message.delete(0);
                    });
                }
                // .cmd update {arg1} {arg2}
                else if (cmd[1] === 'update' && cmd[3]){
                    con.query('SELECT * FROM responses WHERE term = ?', cmd[2], (err, results, fields) => {
                        if (results[0]){
                            con.query('UPDATE responses SET response = ? WHERE term = ?', [ cmd[3], cmd[2] ], (err, results, fields) => {
                                if (err) appexit(err);
                                message.channel.send(`${ cmd[2] } updated`).then( m => { m.delete(10000); } );
                                message.delete(0);
                            });
                        }
                        else{
                            message.channel.send(`${ cmd[2] } command doesn't exist`).then( m => { m.delete(10000); } );
                            message.delete(0);
                        }
                    });
                }
                else {
                    message.channel.send(`Can't find command \`.cmd ${ cmd[2] }\``).then(m => {
                        m.delete(10000);
                    });
                    message.delete(0);
                }
            }
        }
    }
    // if (message.content.startsWith('.ban')){
    //     let m = message.content.split(' ');
    //     //client.banMember(client.members.get('name', m[1]);
    //     client.banMember(message.server.members.get('name'. m[1]), message.server, 10, (err) => {
    //         if (err) appexit(err);
    //         message.channel.send(`User ${ m[1] } Banned`);
    //     });
    // }
    // if (message.content.startsWith('.unban')){
    //     let m = message.content.split(' ');
    //     //client.banMember(client.members.get('name', m[1]);
    //     client.unbanMember(message.server.members.get('name'. m[1]), message.server, (err) => {
    //         if (err) appexit(err);
    //         message.channel.send(`User ${ m[1] } Unbanned`);
    //     });
    // }
    // if (message.content.startsWith('.kick')){
    //     let m = message.content.split(' ');
    //     //client.banMember(client.members.get('name', m[1]);
    //     client.kickMember(message.server.members.get('name'. m[1]), message.server, (err) => {
    //         if (err) appexit(err);
    //         message.channel.send(`User ${ m[1] } Kicked`);
    //     });
    // }

    //Nest tracker
    // if (message.content.startsWith('!nest')){
    //     //NOTES:
    //     //  pins nest pokemon in the format "LOCATION: POKEMON"
    //     //  !nest "{Location}" "{Pokemon}"
    //     //  would be best if someone could report a nest and only gets pinned on admin approval
    //     let pins = message.channel.fetchPinnedMessages().then(pins => {
    //         //call mysql for nests table to see if any of the pins match nests
    //         con.query("", )
    //         let mpins = [];
    //         for (let i in pins){
    //             mpens.append();
    //         }
    //         if (pins[i].value.content === ){
    //
    //         }
    //     });
    // }
}

module.exports = commands;