var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var schedulersRouter = require('./routes/schedulers');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/api/v1/schedulers', schedulersRouter);

//setup conection to mongo

const mongoose = require('mongoose');
const DB_URL = (process.env.DB_URL || 'mongodb+srv://gabriel_Scheduler:TfA92od48xFCq8ie@cluster0.miuwv1w.mongodb.net/schedulers')
console.log("Connecting to database: %s", DB_URL);
mongoose.connect(DB_URL);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'db connection error'));

module.exports = app;
