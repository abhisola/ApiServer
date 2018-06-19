var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
const mailer = require('pug-mailer');
mailer.init({
  service: 'gmail',
  auth: {
    user: 'ahtastraders@gmail.com',
    pass: '09403080450'
  }
});

/* GET users listing. */
router
.post('/:_num', function(req, res, next) {
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

.post('/showreport/:_num', function(req, res, next){
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
      var fetchRack = "SELECT * from racks WHERE racknum='"+racknum+"'";
      var querry = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
        "WHERE date_recorded > '" + start + "' AND  date_recorded < '" + end + "' " +
        "AND racknum = '" + racknum + "' " +
        "ORDER BY date_recorded DESC LIMIT 10";
      console.log(querry);
      var client = new Client(settings.database.postgres);
      client.connect();
      client.query(fetchRack, function(err, dbres) {
        if(dbres) {
          if(dbres.rowCount > 0) {
            var rack = dbres.rows[0];
            console.log(rack);

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
      })
      /*
        client.query(querry, function (err, dbres) {
          console.log(err, dbres);
          if (dbres) {
            var data = {};
            _.forEach(dbres.rows, function(row,i){
              
            })
            mailer.send({
                from: 'ahtastraders@gmail.com',
                to: 'azizahtas@gmail.com', //List of recievers,
                subject: 'Subject of your Mail',
                template: 'shelf',
                data: {}
              })
              .then(res => console.log("Message Sent"))
              .catch(err => console.log(err));
            res.json({
              err: null,
              data: output
            });
          } else {
            res.json({
              err: dbres,
              data: []
            });
          }
          client.end();
        });
        */
})

;



module.exports = router;
