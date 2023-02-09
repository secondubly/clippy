
import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Twitch } from './twitch.js';

const twitch = new Twitch()

const port = process.env.PORT || 5353
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
const server = createServer(app)
const io = new Server(server, {
    path: '/clippy/socket.io'
})

// EXPRESS ROUTING
app.use('/clippy', express.static(__dirname + '/public')); // /clippy will point to all the needed backend files

app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/clippy', (_, res) => {
    console.log('page not found')
    res.sendStatus(404);
});

app.get('/clippy/getclips', async (req, res) => {
    const username = req.query.channel;
    const limit = req.query.limit;

    if(!username || !limit) {
        res.sendStatus(400);
        return;
    }

    const id = await twitch.getUserID(username);
    const clips = await twitch.getClips(id, limit);
    res.json({
        clips: clips.data
    });
    res.end();
})

app.get('/clippy/:host', (req, res) => {
    if(Object.keys(req.query).length === 0 && req.params.host) {
        res.sendFile('index.html', { root: __dirname });
    } else {
        const host = req.params.host
        // emit to a specific room only so we don't need to worry about client-side checking
        // io.to(host).emit('shoutout', { streamer: req.query.streamer, duration: req.query.duration })
        io.to(host).emit('shoutout', { streamer: req.query.streamer, duration: req.query.duration })
        console.log(`Sent shoutout event to room #${host}`)
        res.end();
    }
});

// HELPER FUNCTIONS
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

// SOCKET.IO LISTENERS
io.on('connection', (socket) => {
    const room = socket.handshake['query']['host']
    if (room) {
        socket.join(room)
        console.log(`User joined #${room}`)

        socket.on('disconnect', () => {
            socket.leave(room)
            console.log('user disconnected')
        })
    } else {
        // disconnect?
        socket.disconnect()
    }
    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})

server.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})