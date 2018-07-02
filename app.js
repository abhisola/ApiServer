//taskkill /F /IM node.exe
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var _ = require('lodash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var shelvesRouter = require('./routes/shelves');
var trafficRouter = require('./routes/traffic');
var targetModel = require('./models/target');

var settings = require('./settings');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/shelves', shelvesRouter);
app.use('/traffic', trafficRouter);

app.post('/api/traffic/:_num', function(req,res,next){
  var racknum = req.params['_num'];
  var res_data = req.body;
        var data = {
          racknum: racknum,
          time: res_data.time
        }
        console.log('Data Recieved: ')
        console.log(JSON.stringify(data));
        if (data.time > 0) {
          targetModel.addMotionData(data, function (err, msg) {
            if (err) console.log(err);
            else {
              console.log('Rows Inserted: ')
              console.log(msg.data.rowCount);
            }
          })
        }
        return false;
  res.json({err:null,data:req.body});
});
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
module.exports = app;
