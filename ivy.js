var fs              = require('fs'),
    config          = JSON.parse(fs.readFileSync('./config/config.ini', 'utf8')),//require('./config/config.json'),
    commands        = JSON.parse(fs.readFileSync('./ivy/commands.json')),//require('./ivy/commands.json'),
    mysql           = require('mysql'),
    botname         = config.botname ? config.botname : 'Professor Ivy', //use this to change the nickname -- https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=setNickname
    modules = [],
    adminmodules = [],
    con = false
;

if (typeof config.runners !== 'undefined' && config.runners.indexOf('database') !== -1){
    con = mysql.createPool({
        connectionLimit: 10,
        host: config.dbhost,
        port: config.dbport ? config.dbport : 3306,
        user: config.dbuser,
        password: config.dbpass,
        database: config.dbname,
        charset: 'utf8mb4'
    });
}

// Prepare strings
let ba = require('binascii');
let theStrings = JSON.parse(fs.readFileSync('./ivy/strings.json', 'utf8'));
global.strings = [];
for(let i in theStrings){
    global.strings.push(ba.unhexlify(theStrings[i]));
}

const   Discord     = require('discord.js'),
        client      = new Discord.Client()
;

//Music example
//https://stackoverflow.com/questions/40200869/queuing-audio-to-play-via-discord-bot

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

global.appexit = (err = null) => {
    if (err){
        console.log("\x1b[31m%s\x1b[0m", err);
    }
    if (client){
        //ToDo: Leave music voice channel or check to see if destroy() removes
        client.destroy((err) => {
           console.log(err);
        });
    }
    if (con) con.end();
    process.exit();
};

global.slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

var clientready = () => {
    //ToDo: Set the nickname of the bot to botname
    //ToDo: Join music voice channel

    // Load all modules
    for(let i in config.modules){
        modules.push(require('./src/modules/' + config.modules[i] + '.js'));
    }

    // Load admin-only modules
    for(let i in config.adminmodules){
        adminmodules.push(require('./src/modules/admin/' + config.adminmodules[i] + '.js'));
    }

    // Load and execute runners -- run once then not looked at again
    let runners = [];
    for(let i in config.runners){
        runners.push(require('./src/runners/' + config.runners[i] + '.js'));
    }
    runners.forEach(callback => {
        callback(client, config, commands, con);
    });

    client.user.setGame('Type !help for help');
    console.log(`Running ${ botname }`);
};

var clientmessage = message => {
    //don't respond if it's a bot
    if (message.author.bot) return;
    if (message.content === '' || message.content === '%') return;
    //DM forwarding
    if (message.channel.type === 'dm'){
        //forward to admin
        client.fetchUser(config.adminUserId).then(user => {
            if (user){
                //user.sendMessage is deprecated :(
                user.send(`${message.author.username}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\``);
            }
            else{
                console.log(`User with id ${config.adminUserId} doesn't exist. Fix this in the config before DMs will get forwarded.`);
            }
        });
    }
    //don't respond if not on a text chat
    if (message.channel.type !== 'text') return;

    if (con) {
        //check to see if it has a response
        con.query("SELECT * FROM responses WHERE LOWER(term) = ?", message.content.toLowerCase(), (err, results, fields) => {
            if (err) appexit(err);
            if (results[0]) {
                message.channel.send(results[0].response);
            }
        });
    }

    // Load json assets (intentionally a global var)
    assets = {};
    fs.readdirSync('./src/assets').forEach(function (file) {
        assets[file.replace(/\.json$/, '')] = require('./src/assets/' + file);
    });

    let richEmbed = new Discord.RichEmbed();
    let cmd = message.content.split(' ');
    modules.forEach(callback => {
        callback(message, cmd, config, commands, con, richEmbed);
    });

    //admin commands
    if (message.member.hasPermission("ADMINISTRATOR")) {
        adminmodules.forEach(callback => {
            callback(message, cmd, config, commands, con, richEmbed);
        });
    }
};

client.on('ready', clientready);
client.on('message',  clientmessage);

client.on('guildMemberAdd', (guildmember) => {
    guildmember.send(
        `Welcome to ${ guildmember.guild.name }! Please enjoy your stay\n` +
        ( typeof config.welcomemessage !== 'undefined' && config.welcomemessage ? config.welcomemessage : '')
    )
});

client.login(config.discordtoken);

client.on('disconnect', (event) => {
    console.log(`Disconnected with code ${ event.code }`);
    if(event.code != 1006)
        appexit();
    else
        client.destroy().then(() => client.login(config.discordtoken));
});

//do some cleanup
process.on('SIGINT', () => {
    appexit();
});