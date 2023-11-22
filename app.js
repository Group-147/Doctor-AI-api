const express = require("express");

const app = express();

const { config } = require('dotenv');
config();

const appRouter = require("./routes");

const morgan = require('morgan');
const cookieParser = require("cookie-parser");

// middlewares
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// remove it in production!
app.use(morgan('dev'));

app.use('/api/v1', appRouter);

module.exports = app;