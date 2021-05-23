const port = process.env.PORT || 5353;
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { response } = require('express');
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/public')));

app.get('/clippy', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
})

// http://localhost:5353/clippy/%3Cchannelname%3E?streamer=%3Cusername%3E
// http://localhost:5353/clippy/secondubly?streamer=datto
// https://localhost:5353/clippy
app.get('/clippy/:host', (req, res) => {
    if(isBlank(req.params.host)) {
        res.sendFile('index.html', { root: __dirname });
    } else {
    io.emit('shoutout', { host: req.params.host, streamer: req.query.streamer });
    res.sendFile('index.html', { root: __dirname });
    }
})

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}