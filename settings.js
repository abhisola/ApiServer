var mosca = require('mosca');

var settings = {
    database : {
        redis : {
            backend: {
                type: 'redis',
                redis: require('redis'),
                port: 15356,
                return_buffers: true, // to handle binary payloads
                host: "redis-15356.c11.us-east-1-2.ec2.cloud.redislabs.com",
                password: "kbDG1s4EyMaVbQ1Y7bCErLE2lQ0ciyvd"
            },
            persistence: {
                factory: mosca.persistence.Redis ,
                host:  "redis-15356.c11.us-east-1-2.ec2.cloud.redislabs.com",
                port: 15356,
                password: "kbDG1s4EyMaVbQ1Y7bCErLE2lQ0ciyvd"
            },
            http: {
                port: 1234,
                bundle: true,
                static: './'
            }
        },
        mongo : {
            backend: {
                type: 'mongo',
                url: "mongodb://localhost:27017/target",
                pubsubCollection: 'pubsub',
                mongo: {}
            },
            persistence: {
                factory: mosca.persistence.Mongo,
                url: "mongodb://localhost:27017/target"
            },
            http: {
                bundle: true,
                static: './'
            }
        },
        postgres : {
            user : 'azizahtas',
            password : 'azizahtas',
            database : 'smartrack',
            host: 'smart-rack.cbzabakg0mpj.us-east-1.rds.amazonaws.com',
            port : 5432
        }
    },
   /*mail : {
         service: 'Godaddy',
         host: "smtpout.secureserver.net",
         secureConnection: true,
         port: 465,
             auth: {
                 user: 'alerts@mysmartshelf.com',
                 pass: '@lerts14'
             },
            from: 'alerts@mysmartshelf.com',
            to: [
                'sashi7582@gmail.com',
                'abhishek.solapurkar@itconnectus.com',
                'alerts@mysmartshelf.com',
                'azizahtas@gmail.com'
            ]
   },*/
   mail : {
        service: 'gmail',
        //host: "a2plcpnl0623.prod.iad2.secureserver.net",
        //secureConnection: true,
        //port: 465,
            auth: {
                user: 'smartshelfk@gmail.com',
                pass: 'Chicago2050'
            },
           from: 'alerts@mysmartshelf.com',
           to: [
               'sashi7582@gmail.com',
               'umairs869@gmail.com',
               'alerts@mysmartshelf.com',
               'azizahtas@gmail.com'
           ]
   },
}


module.exports = settings;
