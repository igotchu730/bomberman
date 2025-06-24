/* 
    Imports 
*/
const express = require('express'); // express
const http = require('http'); // http module
const { Server } = require('socket.io'); // websocket


/* 
    Initialize server 
*/
// initialize an express app
const app = express();
// create an http server using express app
const server = http.createServer(app);
// create a socket.io server from the http server
const io = new Server(server);
// serve files from vite's dist folder (where phaser is compiled)
app.use(express.static('dist'));



/* 
    Truth engine 
*/
// track players
const players = {};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
})




/* 
    Start server 
*/
// Retrieve port from env or use default
const PORT = process.env.PORT || 3000;
// Server start
server.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
});