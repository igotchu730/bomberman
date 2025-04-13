const express = require('express');
const app = express();
const path = require('path');


/* Import other files */
const db = require('./database');

app.use(express.static('dist'));


/* Default route; Serve index.html on the root route */
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

/* Retrieve port from env or use default */
const PORT = process.env.PORT || 3000;

/* Server start */
app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
});