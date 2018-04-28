# professor-ivy
Another pogo bot for everything you'd want

## Requirements
1. mysql
2. node.js
3. An available discord server with Admin (or equivilent) permissions

## Install Dependencies
1. `npm install`

## Configure
1. Create file `config/config.ini` (you can base it off `config/config.ini.example`
2. Change presets to your specific configuration
3. Include/disclude any modules

### Required Config Options
1. `dbhost` - database host name
2. `dbuser` - database user name
3. `dbpass` - database password
4. `dbname` - database name
5. `discordtoken` - bot discord token

### Optional Config Options
1. `botname` - will be expanding on later
2. `dbport` - the custom port that your database is running on. Omitting this will assume `3306` (the default MySql port)
3. `adminUserId` - put a user id in here to enable message forwarding - if someone sends a DM to the bot, gets forwarded to this user
4. `modules` - all modules that you want loaded - these are located in `/src/modules/*`
5. `adminmodules` - all admin modules that you want loaded - these are located in `/src/modules/admin/*`
6. `cleanableChannelsIds` - for the channelclean module, these channels will be cleanable when you type in `!clean`
    * NOTE: You can only delete messages newer than 14 days

## Run
`node ivy.js`