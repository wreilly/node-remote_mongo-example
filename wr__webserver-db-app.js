/**
 * Created by william.reilly on 11/4/17.
 *
 * Intent is to adapt the version from Ceeb, for direct installation on AWS,
 * to be a variant that will run for me on Local Node/Express and Local MongoDB.
 *
 * The (re)-config needed to get it down to Local, then back up to AWS,
 * will probably exceed my knowledge of how to "parameterize" that, so,
 * I may well just be hard-coding it for each environment, in the end.
 * O well.
 */

/*
EDIT 2017-11-05
Testing Git:
- Local: git commit to Github = OK
- AWS EC2: git pull = ?

Also wish to use AWS EC2 development edits (occasional) to do git commit from there to Github.
Not a Best Practice, no doubt.

Note:
- on AWS EC2:
 - 'git clone git@github....' did not work
 - needed to use 'git clone http://' to get it work

Has to do with SSH key etc.
One page somewhere tells me:
- the EC2 User cannot create an SSH key that will work to get to Github from EC2
- instead the ROOT user must create an SSH key, to get to Github, from EC2.
 - hmm, ROOT SSH key - does not sound like Best Idea. Hmm.

Another idea I find (on some page somewhere): SSH Agent Forwarding
 https://developer.github.com/v3/guides/using-ssh-agent-forwarding/
 Hmm.
 But that appears to be just to get Deploy to work, out on AWS EC2
 Not, to be able, *from* AWS EC2 to do git commit to Github.
 Hmm.

 Okay, this is my edit.
 Time to do git commit from Local, see what git pull looks like over on AWS EC2.
 */

// This is ca. 2013 code here ...
var http = require('http')
var mongoose = require('mongoose')
var express = require('express')

var app = express()

/*
 > show dbs
 admin       0.000GB
 crunchbase  0.033GB
 local       0.000GB
 m101        0.000GB
 movies      0.000GB
 video       0.001GB

 */
var configWRLocal = {
    "USER": '',
    "PASS": '',
    "HOST": 'localhost', // 127.0.0.1 ?
    "PORT": '27017',
    "DATABASE": "video" // Hmm, we'll see ...
}

var dbConnectPathProtocol = "mongodb://" + configWRLocal.USER + ":" +
        configWRLocal.PASS + "@" +
        configWRLocal.HOST + ":" +
        configWRLocal.PORT + "/" +
        configWRLocal.DATABASE
console.log('dbConnectPathProtocol: ', dbConnectPathProtocol)

var standardGreeting = "Hello Voild!"

var db // our MongoDB database

var greetingSchema // our Mongoose Schema
var Greeting // our Mongoose Model

// create our Schema:
greetingSchema = mongoose.Schema({
    wr__sentence: String
})

// create our model using this Schema:
Greeting = mongoose.model('Greeting', greetingSchema)


// ------------------------
// Connect to our Mongo Database - hosted on same Local
// (on AWS EC2, will be on a 2nd EC2 instance)
// -------------------------

console.log('\nAttempting to connect to MongoDB instance ... ', configWRLocal.HOST)

if ( !(db = mongoose.connect(dbConnectPathProtocol)) )
    console.log('Unable to connect to MongoDB at ' + dbConnectPathProtocol)
else
    console.log('Connecting to MongoDB at ' + dbConnectPathProtocol)

// connection failed event handler
mongoose.connection.on('error', function(err) {
    console.log('database connect error :o( ' + err)
})

// connection successful event handler
mongoose.connection.once('open', function() {
    var greeting
    console.log('database ' + configWRLocal.DATABASE + '  is now open on ' + configWRLocal.HOST)

    Greeting.find( function(err, greetings) {
        if (!err && greetings) {
            console.log(greetings.length + ' greeting(s) already exist in database.')
        } else {
            console.log('no greetings in database yet, creating one')
        }

        greeting = new Greeting({ wr__sentence: standardGreeting})
        greeting.save(function (err, greetingsav) {
            if (err) {
                // TODO handle the error
                console.log('couldn\'t save a greeting to the database!')
            } else {
                console.log('new greeting ' + greeting.wr__sentence + ' was successfully saved to the database. Bon.')
                Greeting.find( function(err, greetings) {
                    if (greetings) {
                        console.log('checked after save: did find ' + greetings.length + ' greetings now in the database. Tres bien.')
                    }
                })
            }
        })
    })
})

// ---------------------------
// Set up Express routes to handle incoming requests
// -----------------------

// for all incoming requests:
app.get('/', function(req, res) {
    var responseText = ''

    console.log('received client request')
    if ( !Greeting ) {
        console.log('Database not ready. sigh.')
    }

    Greeting.find(function(err, greetings) {
        if(err) {
            console.log('couldn\'t find a greeting in the database. error ' + err)
            next(err)
        } else {
            if(greetings) {
                console.log('found ' + greetings.length + ' greetings in the database. Great.')
                responseText = greetings[0].wr__sentence
            }
            console.log('sending greeting to client ' + responseText)
            res.send(responseText)
        }
    })
})

// handle errors
app.use(function(err, req, res, next) {
    if (req.xhr) {
        res.send(500, 'Something went wrong')
    } else {
        next(err)
    }
})

// START SERVER ! EXPRESS:
console.log('starting the Express / NodeJS web server...')
app.listen(9000) // (8080)
console.log('Webserver is listening on port 9000') // 8080')
