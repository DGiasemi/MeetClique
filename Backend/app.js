const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const app = express();

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use('/', routes);

module.exports = app;