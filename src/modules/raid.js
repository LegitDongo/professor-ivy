var raid = function raid(message, cmd, config, commands) {
    //message = object from discord.js
    //cmd = the result of message.content.split(' ');
    if (message.content.startsWith('!raid')) {
        if (cmd[0] && cmd[1]) {
            cmd[1] = cmd[1].toLowerCase();
            let broke = false;
            for (let i in commands.raids) {
                let r = commands.raids[i].names.split(',');
                for (let j in r) {
                    if (r[j] === cmd[1]) {
                        let n = Object.keys(commands.raids[i].pokemon);
                        n = n.join(', ');
                        let m = 'Required people estimate: ' + commands.raids[i].required + '\nPossibilities: ' + n;
                        message.channel.send(m).then(m => {
                            m.delete(10000);
                        });
                        message.delete(0);
                        broke = true;
                        break;
                    }
                }
                if (broke) {
                    break;
                }
                for (let j in commands.raids[i].pokemon) {
                    if (cmd[1] === j.toLowerCase()) {
                        let n = `**Pokemon:** ${ j }\n`;
                        n += `**Max CP:** ${ commands.raids[i].pokemon[j].max }\n`;
                        n += `**Best With:** ${ commands.raids[i].pokemon[j].counters }`;
                        //n += `**Related:** ${ commands.raids[i].pokemon[j].dex }`;
                        if (commands.raids[i].pokemon[j].rate) {
                            n += `\n**Base Catch Rate:** ${ commands.raids[i].pokemon[j].rate.base }%`;
                        }
                        if (commands.raids[i].pokemon[j].offense.superweak) {
                            n += `\n**1.96x Effective:** ${ commands.raids[i].pokemon[j].offense.superweak.join(', ') }`;
                        }
                        if (commands.raids[i].pokemon[j].offense.weak) {
                            n += `\n**1.4x Effective:** ${ commands.raids[i].pokemon[j].offense.weak.join(', ') }`;
                        }
                        if (commands.raids[i].pokemon[j].offense.neutral) {
                            n += `\n**1x Effective:** ${ commands.raids[i].pokemon[j].offense.neutral.join(', ') }`;
                        }
                        if (commands.raids[i].pokemon[j].offense.resist) {
                            n += `\n**0.71x Effective:** ${ commands.raids[i].pokemon[j].offense.resist.join(', ') }`;
                        }
                        if (commands.raids[i].pokemon[j].offense.superresist) {
                            n += `\n**0.51x Effective:** ${ commands.raids[i].pokemon[j].offense.superresist.join(', ') }`;
                        }
                        message.channel.send(n).then(m => {
                            m.delete(100000);
                        });
                        message.delete(0);
                        broke = true;
                        break;
                    }
                }
                if (broke) {
                    break;
                }
            }
        }
    }
}

module.exports = raid;