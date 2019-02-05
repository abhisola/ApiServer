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
  title : "Timelapse",
  active_nav : "timelapse"
}
/* GET users listing. */
router
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
       res.render('timelapse', data);
     })
})
/* Post Date range */
.post('/api/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
      var querry = "SELECT url, shelf, date_recorded FROM timelapse " +
                    "WHERE date_recorded >= '" + start + "' AND  date_recorded <= '" + end + "' " +
                    "AND racknum = '"+racknum+"' " + 
                    "ORDER BY shelf ASC, date_recorded ASC";
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          if(dbres) {
            var output = dbres.rows;
            var data_sorted = _.groupBy(output, function (b) {
              return b.shelf;
            });
            res.json({
              err: null,
              data: data_sorted
            });
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
});

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
