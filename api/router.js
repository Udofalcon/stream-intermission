const cors = require('cors');
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const tmi = require('tmi.js');

const config = JSON.parse(fs.readFileSync('./config.json'));

const app = express();
const client = new tmi.Client({
    identity: {
        username: config.username,
        password: config.password
    },
    channels: [ config.channel ]
})
const server = http.createServer(app);

const users = {};
var token;

app.use(cors());

server.listen(4201, () => {
    console.log('Listening on *:4201');

    getToken().then(() => {
        client.connect().then(() => {
            setTimeout(() => {
                client.say(config.channel, 'Test');
            }, 1000);
        });

        client.on('message', (channel, tags, message, self) => {
            console.log(`[Message] ${tags.username}: ${message}`);
        });

        client.on('join', (channel, username, self) => {
            console.log(`[Join] ${username}`);
            users[username] = '';
        });

        client.on('part', (channel, username, self) => {
            console.log(`[Part] ${username}`);
            delete users[username];
        });
    });
});

app.get('/getUsers', (request, response) => {
    response.send(users);
});

function getToken() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'id.twitch.tv',
            path: `/oauth2/token?client_id=${config.client_id}&client_secret=${config.client_secret}&grant_type=client_credentials`,
            method: 'POST'
        };

        const req = https.request(options, res => {
            var data = '';

            res.on('data', d => {
                data += d;
            });

            res.on('end', () => {
                console.log('Got token');
                token = JSON.parse(data).access_token;
                resolve(token);
            });
        });

        req.on('error', e => {
            reject(e);
        });
        req.end();
    });
}
