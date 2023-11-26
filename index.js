const app = require('./app');

const { config } = require('dotenv');
config({ path: './.env' });

const { connectToDatabase } = require('./db/connection');

// connections
const PORT = process.env.PORT || 5000;

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`server is on ${PORT} and datbase is connected!`);
      });      
}).catch(err => console.log(err));

