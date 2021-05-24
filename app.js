const port = process.env.PORT || 5353;
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/public')));

app.get('/clippy', (req, res) => {
    res.sendStatus(404);
})

app.get('/clippy/:host', (req, res) => {
    if(isBlank(req.query.streamer) && req.params.host) {
        res.sendFile('index.html', { root: __dirname });
    } else {
        io.emit('shoutout', { host: req.params.host, streamer: req.query.streamer });
        res.sendStatus(200);        
    }
})

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}