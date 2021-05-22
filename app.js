const express = require('express')
const app = express()
const port = process.env.port || 5353
const path = require('path')

// static files are located in /public directory, this tells express to serve them
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (request, response) => {
    // send the default index.html file when getting a request to the root directory
    response.sendFile('index.html', {root: __dirname })
});

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})