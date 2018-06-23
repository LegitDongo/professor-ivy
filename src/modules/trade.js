// WILL NEED SOME WAY TO UPDATE TAGS ON A USER - MAYBE A RUNNER TO LISTEN FOR ROLE CHANGING
var trade = function commands(message, cmd, config, commands, con) {
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if (cmd[0] === '!trade' && typeof cmd[1] !== 'undefined') {
        let tag = cmd.slice(1).join(' ').toLowerCase();
        con.query('SELECT tu.nickname, tu.trainerCode FROM tradetags AS tt ' +
            'INNER JOIN tradeusertags AS tut ON tt.id = tut.tagId ' +
            'INNER JOIN tradeusers AS tu ON  tut.userId = tu.id ' +
            'WHERE LOWER(tt.name) LIKE ?', ['%' + tag + '%'], (err, results, fields) => {
            if (err){
                console.log(err);
                message.channel.send('There was an issue accessing trade tags, see log for further details.').then(m => {
                    m.delete(50000);
                });
                return false;
            }
            // There was tags relating
            if(results.length !== 0){
                let mesg = '';
                for (let i in results){
                    mesg += results[i].nickname + ' - ' + results[i].trainerCode + '\n';
                }
                message.channel.send('```\n'+mesg+'```');
            }
            else{
                con.query('SELECT nickname, trainerCode FROM tradeusers WHERE LOWER(nickname) LIKE ? OR LOWER(username) LIKE ? or userId LIKE ?', ['%'+tag+'%', '%'+tag+'%', '%'+tag+'%'], (err2, results2) => {
                    if (results2.length === 0 || err2){
                        if (err2) console.log(err2);
                        message.channel.send('There is either no user, no tag, or no people signed up for this tag matching that request. Please try again.').then(m => {
                            m.delete(50000);
                        });
                        return false;
                    }
                    let msg = '';
                    if (results2.length > 1){
                        msg = 'I found multiple results for that user:\n```\n';
                        for(let i in results2){
                            msg += results2[i].nickname + "'s trainer code is " + results2[i].trainerCode + '\n';
                        }
                        msg += '```'
                    }
                    else{
                        msg = results2[0].trainerCode;
                    }
                    message.channel.send(msg);
                });
            }
        });
    }
    else if (cmd[0] === '!register' && typeof cmd[1] !== 'undefined'){
        let code = cmd.slice(1).join('');
        let user = message.member;
        let nick = false;
        if (typeof user !== 'undefined'){
            nick = user.nickname;
            con.query('SELECT * FROM tradeusers WHERE userId = ?', [ user.id ], (err, results, fields) => {
                if (err){
                    console.log(err);
                    message.channel.send('There was an issue setting your nickname. See log for further details.').then(m => {
                        m.delete(50000);
                    });
                    return false;
                }
                if (results.length === 0){
                    // user does not exist and trainer code should be added with new roles
                    con.query('INSERT INTO tradeusers (trainerCode, username, nickname, userId) VALUES(?,?,?,?)', [ code, user.displayName, nick, user.id ], (err2) => {
                       if (err2){
                           console.log(err2);
                           message.channel.send('There was an issue adding your trainer code to the database. See log for further details.').then(m => {
                               m.delete(50000);
                           });
                           return false;
                       }
                       let addRoles = [];
                       let roles = user.roles.array();
                       for (let i in roles){
                           for (let j in config.tradetags){
                               if (roles[i].name.toLowerCase() === config.tradetags[j].toLowerCase()){
                                   addRoles.push(roles[i].name);
                               }
                           }
                       }
                       if (addRoles.length !== 0){
                           // have array of tag names, but need corresponding ids from database
                           con.query('INSERT INTO tradeusertags(tagId, userId) SELECT id as tagId, (SELECT id FROM tradeusers WHERE userId = "'+user.id+'") as userId FROM tradetags  WHERE name IN (' + '?,'.repeat(addRoles.length).slice(0, -1) + ')', addRoles, (err3, results2) => {
                               if (err3){
                                   console.log(err3);
                                   message.channel.send('There was an issue setting tag information. See log for further details.').then(m => {
                                       m.delete(50000);
                                   });
                                   return false;
                               }
                               message.channel.send('Trainer code added!').then(m => {
                                   m.delete(50000);
                               });
                           });
                       }
                       else{
                           message.channel.send('You have to have an appropriate role to assign your trainer code!').then(m => {
                               m.delete(50000);
                           });
                           return false;
                       }
                    });
                }
                else {
                    // user exists already and trainer code should be updated
                    con.query('UPDATE tradeusers SET trainerCode = ?, nickname = ? WHERE userId = ?', [ code, user.displayName, user.id ], (err2) => {
                        if (err2){
                            console.log(err2);
                            message.channel.send('There was an issue updating your trainer code. See log for further details.').then(m => {
                                m.delete(50000);
                            });
                        }
                        message.channel.send('Trainer code updated.').then(m => {
                            m.delete(50000);
                        });
                    });
                }
            });
        }
    }
};

module.exports = trade;