//location commands
var selfassignrole = function selfassignrole(message, cmd){
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if (message.content.startsWith('.iam') && cmd[1]){
        //role is only valid in searching if the correct case is included
        let role = message.guild.roles.find('name', cmd[1].toProperCase());
        if (role && ivy.config.roles.indexOf(role.name) !== -1){
            if (message.content.startsWith('.iamnot')){
                message.member.removeRole(role).catch(console.error).then(role => {
                    message.reply(`Removed from role ${ cmd[1] }`).then(m => {
                        m.delete(10000);
                    });
                });
            }
            else {
                message.member.addRole(role).catch(console.error).then(role => {
                    message.reply(`Added to role ${ cmd[1] }`).then(m => {
                        m.delete(10000);
                    });
                });
            }
        }
        else{
            message.channel.send(`Error! Could not find role ${ cmd[1] }. Please consult an admin.`).then( m => {
                m.delete(10000);
            });
        }
        message.delete(0);
    }
}

module.exports = selfassignrole;