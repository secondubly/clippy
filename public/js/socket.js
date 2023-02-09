const pathnameHostArray = window.location.pathname.replace(/^\/|\/$/g, '').split('/')
const pathnameHost = pathnameHostArray.at(-1)
const socket = connect(pathnameHost)

// Listeners
socket.on('connect', () => {
    console.log('a user connected')
});

socket.on('disconnect', (reason) => {
    console.log('a user disconnected')
})

socket.on('connect_error', handleNoConnect)
socket.on('connect_timeout', handleNoConnect)


// Helper functions
function connect (roomName) {
    if (!roomName) {
        return null // TODO: error handling?
    }

    console.info('URL Origin', window.location.origin)
    return io(window.location.origin, {
        query: {
            'host': roomName
        }
    })
}

function handleNoConnect() {
    console.warn("No connection to prod environment"); // prod environment url is redacted for safety
    socket = io('http://localhost:5353');
    socket.on('connect_error', handleNoConnectFallback);
    socket.on('connect_timeout', handleNoConnectFallback);
    socket.on('connect', onConnect);
}

function handleNoConnectFallback() {
    console.warn("No connection to localhost, disconnecting");
    socket.on('disconnect', (reason) => {
        socket.disconnect()
    })
    socket = null
    return
    // decide what to do when you can't connect to either
}

socket.on('shoutout', (response) => {
    let duration;
    response.duration ? duration = response.duration : duration = 15;
    
    let channel = document.querySelector("#username");
    channel.textContent = response.streamer;
    
    getClips(response.streamer, undefined, undefined, duration).then(_ => {
        const clip_data = getRandomWeightedClip(topClips);
        if(clip_data) { 
            console.info('Using Clip ', clip_data);
            playClip(true, clip_data); 
        } else {
            // if we don't have a clip, display the mod-check placeholder instead
            console.info('No eligible clips found.');
            defaultClip()
        }
        // TODO: log the clip name and streamer to server side
    }).catch((err) => { console.error(err) });
});

// for testing purposes only
// socket.on('test', (data) => {
//     console.log("Received test event from socket", data)
// })