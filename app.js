const port = 5353;
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {path: "/clippy/socket.io"});

app.use('/clippy', express.static(__dirname + '/public'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/clippy', (req, res) => {
    res.sendStatus(404);
});

app.get('/clippy/:host', (req, res) => {
    if(isBlank(req.query.streamer) && req.params.host) {
        res.sendFile('index.html', { root: __dirname });
    } else {
        io.emit('shoutout', { host: req.params.host, streamer: req.query.streamer });
        res.sendStatus(200);        
    }
});

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

