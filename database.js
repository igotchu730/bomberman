const mongoose = require('mongoose');
require('dotenv').config();


/* MongoDB URL */
const mongoURL = process.env.MONGO_URL;


/* Connect to MongoDB database */
mongoose.connect(mongoURL)
  .then(() => {
    //console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });


/* Test MongoDB connection/query */
const testSchema = new mongoose.Schema({
    name:String
});
const Test = mongoose.model('Test', testSchema, 'testCollection')
/*
async function run() {
    const tester = await Test.find();
    console.log(tester);
}
run();
*/




module.exports = {
    Test
};