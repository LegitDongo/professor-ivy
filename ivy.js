global.__basedir = __dirname;
require('./ivy/globals.js');

ivy.client.on('ready', () => {
    //ToDo: Set the nickname of the bot to botname
    //ToDo: Join music voice channel

    // Load all modules
    for(let i in ivy.config.modules){
        ivy.modules.push(require('./src/modules/' + ivy.config.modules[i] + '.js'));
    }

    // Load admin-only modules
    for(let i in ivy.config.adminmodules){
        ivy.adminmodules.push(require('./src/modules/admin/' + ivy.config.adminmodules[i] + '.js'));
    }

    // Load and execute runners -- run once then not looked at again
    for(let i in ivy.config.runners){
        require('./src/runners/' + ivy.config.runners[i] + '.js')();
    }

    ivy.client.user.setActivity('Type !help for help');
    console.log(`Running ${ ivy.botname }`);
});

ivy.client.on('message',  message => {
    //don't respond if it's a bot
    if (message.author.bot) return;
    if (message.content === '' || message.content === '%') return;
    //DM forwarding
    if (message.channel.type === 'dm'){
        //forward to admin
        ivy.client.fetchUser(ivy.config.adminUserId).then(user => {
            if (user){
                //user.sendMessage is deprecated :(
                user.send(`${message.author.username}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\``);
            }
            else{
                console.log(`User with id ${ivy.config.adminUserId} doesn't exist. Fix this in the config before DMs will get forwarded.`);
            }
        });
    }
    //don't respond if not on a text chat
    if (message.channel.type !== 'text') return;

    if (ivy.con) {
        //check to see if it has a response
        ivy.con.query("SELECT * FROM responses WHERE LOWER(term) = ?", message.content.toLowerCase(),
            (err, results) => {
                if (err) ivy.appexit(err);
                if (results[0]) {
                    message.channel.send(results[0].response);
                }
            });
    }

    let richEmbed = new ivy.Discord.RichEmbed();
    let cmd = message.content.split(' ');

    ivy.modules.forEach(callback => {
        callback(message, cmd, richEmbed);
    });

    //admin commands
    if (message.member.hasPermission("ADMINISTRATOR")) {
        ivy.adminmodules.forEach(callback => {
            callback(message, cmd, richEmbed);
        });
    }
});

ivy.client.on('guildMemberAdd', (guildMember) => {
    guildMember.send(
        `Welcome to ${ guildMember.guild.name }! Please enjoy your stay\n` +
        ( typeof ivy.config.welcomemessage !== 'undefined' && ivy.config.welcomemessage ? ivy.config.welcomemessage : '')
    )
});

ivy.client.login(ivy.config.discordtoken);

ivy.client.on('disconnect', (event) => {
    console.log(`Disconnected with code ${ event.code }`);
    if(event.code !== 1006)
        ivy.appexit();
    else
        ivy.client.destroy().then(() => ivy.client.login(ivy.config.discordtoken));
});

//do some cleanup
process.on('SIGINT', () => {
    ivy.appexit();
});