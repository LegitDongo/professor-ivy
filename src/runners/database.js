var database = function database(){
    // Common responses table
    if (typeof ivy.config.adminmodules !== 'undefined' && ivy.config.adminmodules.indexOf('commands') !== -1) {
        ivy.con.query('SELECT 1 FROM responses LIMIT 1', (err) => {
            if (err && err.code !== 'ER_NO_SUCH_TABLE'){
                ivy.appexit(err);
                return;
            }

            // We can only get here if the table doesn't exist
            console.log('responses table doesn\'t exist. Attempting to create');
            ivy.con.query('CREATE TABLE `responses` (\n' +
                '  `Id` int(11) NOT NULL AUTO_INCREMENT,\n' +
                '  `term` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                '  `response` varchar(1000) COLLATE utf8mb4_bin NOT NULL,\n' +
                '  `creator` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                '  PRIMARY KEY (`Id`)\n' +
                ') ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin', (err) => {
                if (err) ivy.appexit(err);
            });
        });
    }


    if(typeof ivy.config.modules !== 'undefined'){
        // Trade codes tables
        if (ivy.config.modules.indexOf('trade') !== -1){
            ivy.con.query('SELECT 1 FROM tradetags LIMIT 1', (err) => {
                if (err && err.code !== 'ER_NO_SUCH_TABLE'){
                    ivy.appexit(err);
                    return;
                }

                // We can only get here if the table doesn't exist
                console.log('tradetags table doesn\'t exist. Attempting to create');
                ivy.con.query('CREATE TABLE `tradetags` (\n' +
                    '  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
                    '  `name` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                    '  PRIMARY KEY (`id`)\n' +
                    ') ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin', (err) => {
                    if (err) ivy.appexit(err);
                });
            });
            ivy.con.query('SELECT 1 FROM tradeusers LIMIT 1', (err) => {
                if (err && err.code !== 'ER_NO_SUCH_TABLE'){
                    ivy.appexit(err);
                    return;
                }

                // We can only get here if the table doesn't exist
                console.log('tradeusers table doesn\'t exist. Attempting to create');
                ivy.con.query('CREATE TABLE `tradeusers` (\n' +
                    '  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
                    '  `trainerCode` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                    '  `username` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                    '  `nickname` varchar(50) COLLATE utf8mb4_bin NOT NULL,\n' +
                    '  `userId` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,\n' +
                    '  PRIMARY KEY (`id`)\n' +
                    ') ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin', (err) => {
                    if (err) ivy.appexit(err);
                });
            });
            ivy.con.query('SELECT 1 from tradeusertags LIMIT 1', (err) =>{
                if (err && err.code !== 'ER_NO_SUCH_TABLE'){
                    ivy.appexit(err);
                    return;
                }

                // We can only get here if the table doesn't exist
                console.log('tradeusertags table doesn\'t exist. Attempting to create');
                ivy.con.query('CREATE TABLE `tradeusertags` (\n' +
                    '  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
                    '  `tagId` int(11) NOT NULL,\n' +
                    '  `userId` int(11) NOT NULL,\n' +
                    '  PRIMARY KEY (`id`)\n' +
                    ') ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin', (err) => {
                    if (err) ivy.appexit(err);
                });
            });
        }
    }
};

module.exports = database;