var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
const mailer = require('pug-mailer');
var { DateTime } = require('luxon');

mailer.init({
  service: settings.mail.service,
  auth: settings.mail.auth
});
var sent_from = settings.mail.from;
var sent_to = settings.mail.to;
var data = {
  title : "Smart Rack Shelves"
};
/* GET users listing. */
router
.get('/', function (req, res, next) {
  res.redirect('shelves/000001');
})
.get('/:_num', function(req, res,next) {
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
              data.shelf_count = rack.shelves;
              data.success = true;
            } else {
              data.racknum = racknum;
              data.success = false;
              data.msg = "Sorry the rack with Id " + racknum + " doesnot exist";
            }
          }else {
              data.success = false;
              data.msg = "Sorry Something went wrong serverside";
          }
          res.render('shelf_board', data);
          client.end();
        })
})
.post('/api/range/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;

      var querry = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
        "WHERE date_recorded > '" + start + "' AND  date_recorded < '" + end + "' " +
              "AND racknum = '"+racknum+"' " +
              "ORDER BY date_recorded ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
      client.connect();

      client.query(querry, function (err, dbres){
        console.log(err, dbres);
        if(dbres) {
          var output = _.groupBy(dbres.rows, function(b) { return b.shelf_num;});
          res.json({err:null,data:output});
        } else {
          res.json({err:dbres,data:[]});
        }
        client.end();
      });
})

.get('/api/sendreport/yesterday/:_num', function(req, res, next){
      var data = req.body;
      var racknum = req.params['_num'];
      var start = getDate() + "T00:01:00";
      var end = getDate() + "T23:59:00";
      var fetchRack = "SELECT * from racks WHERE racknum='"+racknum+"'";
      var client = new Client(settings.database.postgres);
      client.connect();
      client.query(fetchRack, function(err, dbres) {
        if(dbres) {
          if(dbres.rowCount > 0) {
            var rack = dbres.rows[0];
            console.log(rack);
            var querry = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
              "WHERE date_recorded > '" + start + "' AND  date_recorded < '" + end + "' " +
              "AND racknum = '" + racknum + "' " +
              "ORDER BY date_recorded DESC , shelf_num ASC LIMIT "+rack.shelves;
              console.log(querry);
            client.query(querry, function(err, dbresponse){
              if (dbresponse) {
                var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
                var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
                var template_data = {
                  rackname : rack.name,
                  address : rack.address,
                  start: format_start,
                  end: format_end,
                  shelves : []
                }
                _.forEach(dbresponse.rows, function (row,i) {
                  if(i == row.shelf_num) {
                    var shelf = {
                      percent: Math.round(100 - parseInt(row.percent)),
                      shelf_num: row.shelf_num,
                      url: row.url
                    }
                    template_data.shelves.push(shelf);
                  }
                })
                mailer.send({
                  from: sent_from,
                  to: sent_to, //List of recievers,
                  subject: 'Target Smart Shelf - Out of Stock Alerts from Kellogs',
                  template: 'shelf',
                  data: template_data
                })
                .then(resp=> {
                  res.render('../mails/templates/shelf', template_data);
                })
                .catch(err=>{
                  res.json({
                    success: false,
                    msg: 'Error Sending Mail!',
                    data: []
                  });
                })
              } else {
                res.json({ success: false, msg: 'Something Went Wrong While fetching data', data: [] });
              }
            })

          } else {
             res.json({
               success: false,
               msg: 'Rack Not Found',
               data: []
             });
          }
        } else {
          res.json({success: false, msg: 'Something Went Wrong', data: []});
        }
        client.end();
      });
      
})
;

function getDate() {
  var today = new Date();

  var year = today.getFullYear();

  var month = today.getMonth() + 1;
  month = (month < 10 ? "0" : '') + month;

  var day = today.getDate();
  day = day-2;
  day = (day < 10 ? "0" : '') + day;

  return year + "-" + month + "-" + day;
}


module.exports = router;
