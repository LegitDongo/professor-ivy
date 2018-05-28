var fs              = require('fs'),
    config          = JSON.parse(fs.readFileSync('./config/config.ini', 'utf8')),//require('./config/config.json'),
    commands        = JSON.parse(fs.readFileSync('./ivy/commands.json')),//require('./ivy/commands.json'),
    mysql           = require('mysql'),
    botname         = config.botname ? config.botname : 'Professor Ivy', //use this to change the nickname -- https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=setNickname
    con             = mysql.createConnection({
        host: config.dbhost,
        port: config.dbport ? config.dbport : 3306,
        user: config.dbuser,
        password: config.dbpass,
        database: config.dbname,
        charset: 'utf8mb4'
    }),
    modules = [],
    adminmodules = []
;
const   Discord     = require('discord.js'),
        client      = new Discord.Client()
;

//Music example
//https://stackoverflow.com/questions/40200869/queuing-audio-to-play-via-discord-bot

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var appexit = (err = null) => {
    if (err){
        console.log("\x1b[31m%s\x1b[0m", err);
    }
    if (client){
        //ToDo: Leave music voice channel or check to see if destroy() removes
        client.destroy((err) => {
           console.log(err);
        });
    }
    con.end();
    process.exit();
};

con.connect(err => {
   if (err) appexit(err);
   console.log(`${ config.dbhost } connection successful`);
   //check if database exists:
   //  con.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${ config.dbname }'`, (err, results, fields) =>{
   //      if (err) appexit(err);
   //      if (!results[0]) {
   //          console.log(`${ config.dbname } does not exist. Create the database first!`);
   //          appexit();
   //      }
        // for //loop through create table scripts in seperate config-like file
        // con.query('CREATE TABLE responses (Id INT, term VARCHAR(50), response VARCHAR(150) Creator VARCHAR(50)', (err, result) =>{
        //
        // });
    //});
});

var clientready = () => {
    //ToDo: Set the nickname of the bot to botname
    //ToDo: Join music voice channel

    //Load all modules
    for(let i in config.modules){
        modules.push(require('./src/modules/' + config.modules[i] + '.js'));
    }
    for(let i in config.adminmodules){
        adminmodules.push(require('./src/modules/admin/' + config.adminmodules[i] + '.js'));
    }
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

    //check to see if it has a response
    con.query("SELECT * FROM responses WHERE LOWER(term) = ?", message.content.toLowerCase(), (err, results, fields) => {
        if (err) appexit(err);
        if (results[0]) {
            message.channel.send(results[0].response);
        }
    });

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