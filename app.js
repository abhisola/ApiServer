//taskkill /F /IM node.exe
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var _ = require('lodash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var levelsRouter = require('./routes/levels');
var targetRouter = require('./routes/targetController');
var targetModel = require('./models/target');

var settings = require('./settings');
var racks = require('./racks');
var app = express();

var mqtt = require('mqtt')
var client  = mqtt.connect('ws://smartrackmqtt.herokuapp.com')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('mqttclient',client);
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
app.use('/api/levels', levelsRouter);
app.use('/api/target', targetRouter);

app.post('/api/traffic/:_num', function(req,res,next){
  var racknum = req.params['_num'];
  var res_data = req.body;
  //client.publish('motiondetect/target/'+racknum, JSON.stringify(data));
  _.forEach(racks, function (rack) {
      if (racknum == rack.racknum) {
        var data = {
          racknum: rack.racknum,
          time: res_data.time
        }
        if (res_data.time > 0) {
          targetModel.addMotionData(data, function (err, msg) {
            if (err) console.log(err);
            else {
              console.log(msg);
            }
          })
        }
        return false;
      }
    })
  res.json({err:null,data:req.body});
})
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

client.on('connect', function() {
	console.log('Connected');
  _.forEach(racks,function(rack) { 
    //client.subscribe('motiondetect/target/'+rack.racknum);
    //console.log("subscribed to "+'motiondetect/target/'+rack.racknum)
  });
});

// fired when a message is received
client.on('message', function(topic, message) {
  console.log('message', topic, message.toString());
  _.forEach(racks,function(rack) {
      var motioncount = 'motiondetect/target/'+rack.racknum;
      var tmp = JSON.parse(message.toString());
          if (topic == motioncount) {
            var data = {
              racknum : rack.racknum,
              time : tmp.time
            }
            if(tmp.time > 0) {
              targetModel.addMotionData(data, function(err, msg){
                if(err) console.log(err);
                else {
                  console.log(msg);
                }
              })
            }
            return false;
          }
      })
});
module.exports = app;