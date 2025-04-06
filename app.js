const express = require('express');
const app = express();

/* Default route */
app.get('/',(req,res) => {
    res.send('Server is running!')
})

/* Retrieve port from env or use default */
const PORT = process.env.PORT || 3000;

/* Server start */
app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
});