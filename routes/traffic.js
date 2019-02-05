var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
const mailer = require('pug-mailer');
var settings = require('../settings');
var { DateTime } = require('luxon');
mailer.init({
  service: settings.mail.service,
  auth: settings.mail.auth
});
var sent_from = settings.mail.from;
var sent_to = settings.mail.to;
var data = {
  title : "Traffic",
  active_nav : "traffic"
}
/* GET users listing. */
router
.get('/', function (req, res, next) {
  res.redirect('traffic/000001');
})
.get('/:_num', function(req, res, next){
     var racknum = req.params['_num'];
     var fetchRack = "SELECT * from racks WHERE racknum='" + racknum + "'";
     var client = new Client(settings.database.postgres);
     client.connect();
     client.query(fetchRack, function (err, dbres) {
       if (dbres) {
         if (dbres.rowCount > 0) {
           var rack = dbres.rows[0];
           console.log(rack);
           data.racknum = rack.racknum;
           data.rackname = rack.name;
           data.address = rack.address;
           data.success = true;
           data.timezone = rack.time_zone;
         } else {
           data.racknum = racknum;
           data.success = false;
           data.msg = "Sorry the rack with Id " + racknum + " doesnot exist";
         }
       } else {
         data.success = false;
         data.msg = "Sorry Something went wrong serverside";
       }
       client.end();
       res.render('traffic_board', data);
     })
})
.delete('/api/today/:_num', function(req, res, next) {
      var today = new Date();
      var dateString = today.getFullYear() + "-" + (today.getMonth()+1) +"-"+ today.getDate();
      var racknum = req.params['_num'];
        var querry = "DELETE FROM motion_detect " + 
                    "WHERE local_time >= '" + dateString + "' AND racknum = '" + racknum + "' ";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            res.json({err:null,data:dbres.rows});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
/* Get PIR moton Date range */
.post('/api/range/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
        var querry = "SELECT racknum,date_recorded::text,time_recorded,local_time::text FROM motion_detect " +
                    "WHERE local_time >= '" + start + "' AND  local_time <= '" + end + "' " +
                    "AND racknum = '"+racknum+"' " + 
                    "ORDER BY local_time ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          if(dbres) {
            var output = dbres.rows;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
.get('/api/sendreport/:_days/:_num', function (req, res, next) {
  var data = req.body;
  var racknum = req.params['_num'];
  var days = parseInt(req.params['_days']);
  var start = getDate(days) + "T00:00:00";
  var end = getDate(days) + "T23:59:00";
  var fetchRack = "SELECT * from racks WHERE racknum='" + racknum + "'";
  var client = new Client(settings.database.postgres);
  var clientB = new Client(settings.database.postgres);
  client.connect();
  clientB.connect();
  client.query(fetchRack, function (err, dbres) {
    if (dbres) {
      if (dbres.rowCount > 0) {
        var rack = dbres.rows[0];
        console.log(rack);
        var querry = "SELECT racknum,date_recorded,time_recorded,local_time FROM motion_detect " +
          "WHERE local_time >= '" + start + "' AND  local_time <= '" + end + "' " +
          "AND racknum = '" + racknum + "' " +
          "ORDER BY local_time ASC";
        console.log(querry);
        clientB.query(querry, function (err, dbresponse) {
          if (dbresponse) {
            var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
            var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
            var template_data = {
              rackname: rack.name,
              address: rack.address,
              start: format_start,
              end: format_end,
              people_count: dbresponse.rowCount,
              dwell_time : 0
            }
            var sum = 0;
            _.forEach(dbresponse.rows, function (row) {
              sum += parseInt(row.time_recorded)
            })
            template_data.dwell_time = sum / template_data.people_count;
            template_data.dwell_time = template_data.dwell_time.toFixed(2);
            console.log(template_data);
            /*mailer.send({
              from: sent_from,
              to: sent_to, //List of recievers,
              subject: 'Target Smart Shelf - Out of Stock Alerts from Kellogs',
              template: 'shelf',
              data: template_data
            })
            */
            res.render('../mails/templates/traffic', template_data);
          } else {
            res.json({
              success: false,
              msg: 'Something Went Wrong While fetching data',
              data: []
            });
          }
          clientB.end();
        })
      } else {
        res.json({
          success: false,
          msg: 'Rack Not Found',
          data: []
        });
      }
    } else {
      res.json({
        success: false,
        msg: 'Something Went Wrong',
        data: []
      });
    }
    client.end();
  })
})
;
function getDate(days = 0) {
  var today = new Date();

  var year = today.getFullYear();

  var month = today.getMonth() + 1;
  month = (month < 10 ? "0" : '') + month;

  var day = today.getDate();
  day = day - days;
  day = (day < 10 ? "0" : '') + day;

  return year + "-" + month + "-" + day;
}


module.exports = router;
