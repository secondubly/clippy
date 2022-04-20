
import express from 'express';
import fetch from 'node-fetch';
import { createServer, STATUS_CODES } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

const twitch_oauth_url = `https://id.twitch.tv/oauth2/token`
const twitch_clips_url = `https://api.twitch.tv/helix/clips`
const port = 5353;

const app = express();
const server = createServer(app);
// const io = new Server(server, { path: '/clippy/socket.io' });
const io = new Server(server, {
    path: '/clippy/socket.io'
});
const __dirname = new URL('.', import.meta.url).pathname;

app.use('/clippy', express.static(__dirname + 'public'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/clippy', (req, res) => {
    res.sendStatus(404);
});

app.get('/clippy/getclips', async (req, res) => {
    const username = req.query.channel;
    const limit = req.query.limit;

    if(!username || !limit) {
        res.sendStatus(400);
        return;
    }
    // get bearer token
    const token = await getBearerToken();
    const id = await getUserID(username, token);
    const clips = await getClips(id, token, limit);
    res.json({
        clips: clips.data
    });
    res.end();
})
app.get('/clippy/placeholder.html', (req, res) => {
    res.sendFile(__dirname + 'placeholder.html');
})
app.get('/clippy/:host', (req, res) => {
    if(isBlank(req.query.streamer) && req.params.host) {
        res.sendFile('index.html', { root: __dirname });
    } else {
        io.emit('shoutout', { host: req.params.host, streamer: req.query.streamer, duration: req.query.duration });
        // res.sendStatus(200);        
        res.end();
    }
});

async function getClips(id, token, limit = 100) {
    const req_url = `${twitch_clips_url}?broadcaster_id=${id}&first=${limit}`
    const response = await fetch(req_url, {
        method: 'GET',
        headers: {'Client-Id':  process.env.CLIENT_ID, 'Authorization': `Bearer ${token}`}
    })

    
    if(response.statusText != STATUS_CODES[200]) {
        return response.status;
    }
    const data = await response.json();
    return data;
}

function generateOauthParams(clientID, clientSecret, scopes = []) {
    const body = {
        client_id: clientID,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    }

    return JSON.stringify(body);
}

async function getBearerToken(scopes = []) {
    const response = await fetch(twitch_oauth_url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: generateOauthParams(process.env.CLIENT_ID, process.env.CLIENT_SECRET, scopes)
    });

    if(response.statusText !== STATUS_CODES[200]) {
        return response.status
    }
    const data = await response.json();
    return data.access_token
}

async function getUserID(username, bearer_token) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        method: 'GET',
        headers: {'Client-Id':  process.env.CLIENT_ID, 'Authorization': `Bearer ${bearer_token}`}
    });

    if(response.statusText !== STATUS_CODES[200]) {
        return response.status // TODO: error handling
    }
    const users = await response.json();
    return users.data[0].id
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} successfully connected`);
    socket.on('shoutout-success', (data) => {
        console.log(data);
    });
});

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
});