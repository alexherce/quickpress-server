require('./global_functions');  //instantiate global functions

const createError = require('http-errors');
const express = require('express');
const debug = require('debug')('quickpress-server:server');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index');
const db = require('./models/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes setup
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Connect to MySQL on start
db.connect(db.MODE_PRODUCTION, function(err) {
  if (err) {
    console.log('ERROR: Unable to connect to MySQL: ' + err);
  } else {
    console.log('Connected to MySQL!');
  }
})

const port = process.env.PORT || '4000';
app.set('port', port);

const server = http.createServer(app);
const websocket = socketio(server);

server.listen(port);
server.on('listening', () => {
  console.log("Running on port " + port);
});

websocket.of('/live').on('connection', (socket) => {
  console.log('A client just joined on ', socket.id);

  socket.on('chat message', (msg, callback) => {
    console.log(msg);
    callback('ok!');
  });
});
