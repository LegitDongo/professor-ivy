# professor-ivy
Another Discord pogo bot for everything you'd want.

A few of the features include (in modules):
* Dynamic Raid information (see `!raid`)
* Respond to specific words without the need for a prefix (see `!ivy cmd`)
* Modularized commands

## Requirements
1. mysql
2. node.js
3. An available discord server with Admin (or equivalent) permissions

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

I *highly* suggest using a process manager such as [pm2](http://pm2.keymetrics.io/).

# General Help
There are two ways to get a list of every possible command in Ivy, either `!ivy cmd`, `!ivy commands`, or `!help`

There are a different set of commands based on the modules for admins.

This will give a broad overview of all commands, including all module commands.

## Database Commands/Responses
With this set of commands you can do the following:
* Get a list of all commands on the database (by page)
* Add/Update/Remove commands from database

When anything is typed into a message on any channel on Discord, Ivy will check this message to see if it
matches one of the commands listed in the database.

If nothing is found, it goes onto the modules to see if something in one of those matches.

To get a list of all of the database commands/responses, use `!ivy cmd {number}` where `{number}` is a page number (10 per page).

Ex. `!ivy cmd 1` would get the first 10 results from the DB

The following commands are *for admins only*

***Note: Spaces are important when it comes to adding, removing, and updating commands, as well as the placement of the double quotes***

### Adding New Commands
To add a new command, use `.cmd add "command title" "command value"` where `command title` will be the name of the
key in the database and `command value` will be the response

Ex. `.cmd add "wew" "lad"` will have Ivy respond with `lad` when anybody types `wew`

## Updating Commands
To update any database command, use `.cmd update "command title" "command value"` -- this will remove the previous
value that was in the database for `command title` and replace it with `command value`

Ex. `.cmd update "wew" "Not lad"` will have Ivy respond with `Not lad` when someone types `wew` instead of
`lad` as listed in the previous example

### Deleting Commands
To remove any command from the database use `.cmd rm "command title"` where `command title` is the key in the database

Ex. `.cmd rm "wew"` would delete the `wew` command as listed in the previous example

Keep in mind that this is *non-recoverable* unless you make database backups prior and restore from them.


## Disabling/Enabling Modules
By default, as listed in the `config/config.ini.example` file, the default enabled modules are 
```
"modules": [
   "raid", "selfassignrole", "channelclean", "commands"
 ]
```
and the default admin-only modules are
```
"adminmodules": [
   "commands"
 ]
```

These values represent the name of the files in the `src/modules` and `src/modules/admin` folders respectively.

To disable any of these, just take that value out of the list there

**Note: be careful that your file remains in a valid json format**

For example, in removing the channelclean module, the `modules` section would look like the following
```
"modules": [
   "raid", "selfassignrole", "commands"
 ]
```
***Keep in mind this removes the double quotes and extra comma as well***

## Creating Your Own Module

If you feel yourself tech savvy and think Ivy could use some neat new features, feel free to
create your own module and add it to either the `src/modules`, or `src/modules/admin`, enable it in your
config file, and use it along with Ivy!

***Note: We cannot support custom code***

If you feel that your module would make for a good addition to Ivy, feel free to make a PR.
It will be reviewed promptly and responded to when time allows.

## Brief Default Modules Overview
* `!raid {monster name}`
    * This module is for detailed dynamic info on a raid boss in pogo in a neat embedded format.
    * This info is updated every month, or when `cache\raids.json` is deleted and another of these commands is used.
* `.iam {role name}`
    * Modeled after Nadeko's `.iam` format, this will allow any user to give themselves a role from an allowed
    role list that's defined in `config/config.ini.example` in the `roles` section.
    * The `roles` section in the config file *has* to be modified before this will work appropriately.
    * This is perfect for raid communities that have town or team roles
* `!clean` !!Still Experimental!!
    * Allows for any user to type `!clean` in a channel and the last 14 days of activity will be deleted from that channel
    *as long as* that channel id is included in the `cleanableChannelsIds` list in `config/config.ini.example`.
    * Recommended to move into `modules/admin` or disable to avoid any unnecessary spam from users.
    * I'm still looking for a decent way to clean up *all* messages in a channel since one of the Discord JS API
    limitations only allows for deletion up to 14 days prior.
* `!ivy commands`
    * This is explained in more detail in the above sections

I hope you enjoy this project! ^-^

[Buy me a Beer 🍻](https://ko-fi.com/Z8Z3AVDQ)