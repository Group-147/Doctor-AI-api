const express = require("express");

const app = express();

require('dotenv').config({ path: './.env' });

const appRouter1 = require("./v1/routes")
const appRouter2 = require("./v2/routes");

const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

// middlewares
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors({ origin: "*", credentials: true })); // change to the real origin in production.
app.use(helmet());

// remove it in production!
app.use(morgan('dev'));

app.use('/api/v1', appRouter1);
app.use('/api/v2', appRouter2);

module.exports = app;