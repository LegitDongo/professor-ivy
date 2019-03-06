global.ivy = (() => {
    const folderRoot = __basedir + '/',
          Discord    = require('discord.js');
    let fs     = require('fs'),
        config = JSON.parse(fs.readFileSync(folderRoot + 'config/config.ini', 'utf8')),
        mysql  = require('mysql'),
        con    = false
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

    // Prepare special strings
    let ba = require('binascii');
    let theStrings = JSON.parse(fs.readFileSync(folderRoot + 'ivy/strings.json', 'utf8'));
    let strings = theStrings.map(string => ba.unhexlify(string));

    // Load json assets
    let assets = {};
    fs.readdirSync(folderRoot + 'src/assets').forEach(function (file) {
        assets[file.replace(/\.json$/, '')] = require(folderRoot + 'src/assets/' + file);
    });

    String.prototype.toProperCase = function () {
        return this.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    let appexit = (err = null) => {
        if (err) {
            console.log("\x1b[31m%s\x1b[0m", err);
        }
        if (ivy.client) {
            //ToDo: Leave music voice channel or check to see if destroy() removes
            ivy.client.destroy((err) => {
                console.log(err);
            });
        }
        if (ivy.con){
            ivy.con.end();
        }
        process.exit();
    };

    let slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    return {
        strings: strings,
        assets: assets,
        appexit: appexit,
        slugify: slugify,
        fs: fs,
        commands: JSON.parse(fs.readFileSync(folderRoot + 'ivy/commands.json')),
        config: config,
        con: con,
        botname: config.botname ? config.botname : 'Professor Ivy', //use this to change the nickname -- https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=setNickname
        modules: [],
        adminmodules: [],
        Discord: Discord,
        client: new Discord.Client(),
        request: require('request-promise')
    };
})();