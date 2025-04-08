const express = require('express');
const app = express();


/* Import other files */
const db = require('./database');



/* Default route */
app.get('/', async (req, res) => {
    try {
        //test db connection
        const tester = await db.Test.find();
        const resultString = JSON.stringify(tester);
        res.send(`Server is Running!, TEST: ${resultString}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/* Retrieve port from env or use default */
const PORT = process.env.PORT || 3000;

/* Server start */
app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
});