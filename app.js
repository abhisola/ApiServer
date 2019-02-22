//taskkill /F /IM node.exe
    //"preinstall": "npm install pm2 -g",
    //"start": "pm2-runtime start ecosystem.config.js --env production"

    var WORKERS = process.env.WEB_CONCURRENCY || 1;;
    const throng = require('throng');
    
    throng({
      workers: WORKERS,
      lifetime: Infinity
    }, start)
    
    var server;
    var debug;
    var http;
    
    function start(id) {
      console.log(`Started worker ${ id }`);
      var createError = require('http-errors');
      var express = require('express');
      var app = express();
      var path = require('path');
      var cookieParser = require('cookie-parser');
      var logger = require('morgan');
      var _ = require('lodash');
      var { Pool, Client } = require('pg');
      var indexRouter = require('./routes/index');
      var usersRouter = require('./routes/users');
      var shelvesRouter = require('./routes/shelves');
      var trafficRouter = require('./routes/traffic');
      var targetModel = require('./models/target');
      var timelapseRouter = require('./routes/timelapse_router');
      var locationRouter = require('./routes/location');
    
      //Temporary Routes
      var tofdemoRouter = require('./routes/tof_sensor_demo');
      var settings = require('./settings');
    
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
      app.use('/timelapse', timelapseRouter);
      app.use('/location', locationRouter);
      app.use('/tof_sensor_demo', tofdemoRouter);
    
      app.post('/api/traffic/:_num', function(req,res,next){
        var racknum = req.params['_num'];
        var res_data = req.body;
              var data = {
                racknum: racknum,
                time: res_data.time
              }
              var fetch_time_diff = "select * from racks where racknum=$1 limit 1"
              const pool = new Pool(settings.database.postgres);
              (async () => {
                var racks = await pool.query(fetch_time_diff, [racknum]);
                const row = racks.rowCount>0?racks.rows[0]:null;
                if(row) {
                  data.time_diff = row.time_diff;
                } else {
                  data.time_diff = 0;
                }
                console.log('Data Recieved: ')
                console.log(JSON.stringify(data));
                if (data.time > 0) {
                  targetModel.addMotionData(data, function (err, msg) {
                    if (err) res.send("Save Error");
                    else {
                      console.log('Rows Inserted: ')
                      console.log(msg.data.rowCount);
                      res.send("Data Saved");
                    }
                  })
                }
                
              })().catch(e => setImmediate(() => {console.error(e);}))
    
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
    
      debug = require('debug')('smartrackweb:server');
      http = require('http');
    
    /**
     * Get port from environment and store in Express.
     */
    
    var port = normalizePort(process.env.PORT || '3001');
    app.set('port', port);
    
    /**
     * Create HTTP server.
     */
    
    server = http.createServer(app);
    
    /**
     * Listen on provided port, on all network interfaces.
     */
    
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
      
    }
    function onError(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }
    
      var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    
      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    
      process.on('SIGTERM', () => {
        console.log(`Worker ${ id } exiting...`);
        console.log('(cleanup would happen here)');
        process.exit();
      });
    }
    
    function onListening() {
      var addr = server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      debug('Listening on ' + bind);
    }
    
    function normalizePort(val) {
      var port = parseInt(val, 10);
    
      if (isNaN(port)) {
        // named pipe
        return val;
      }
    
      if (port >= 0) {
        // port number
        return port;
      }
    
      return false;
    }
    //module.exports = app;
    