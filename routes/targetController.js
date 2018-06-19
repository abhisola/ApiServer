var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
/* GET users listing. */
router
/* Get Head count with date range */
.post('/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
        var querry = "SELECT racknum,time_recorded,date_recorded FROM target " + 
                    "WHERE date_recorded > '"+start+"' AND  date_recorded < '"+end+"' " + 
                    "AND racknum = '"+racknum+"' " + 
                    "ORDER BY target.date_recorded ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var output = dbres;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
/* Get Todays Head Count */
.get('/today/:_num', function(req, res, next) {
      var today = new Date();
      var dateString = today.getFullYear() + "-" + today.getMonth() +"-"+ today.getDate();
      var racknum = req.params['_num'];
        var querry = "SELECT time_recorded FROM target " + 
                    "WHERE date_recorded > '"+dateString+"' AND racknum = '"+racknum+"' " + 
                    "ORDER BY target.date_recorded ASC, target.time_recorded ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var sum = 0;
            _.forEach(dbres.rows, function(row){
              sum += parseInt(row.time_recorded);
            });
            var avg = sum / dbres.rowCount;
            var output = {
              total : dbres.rowCount,
              avg : Math.round(avg)
            };
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
/* Get foot count with date range */
.post('/foot/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
        var querry = "SELECT racknum,date_recorded FROM foot " + 
                    "WHERE date_recorded > '"+start+"' AND  date_recorded < '"+end+"' " + 
                    "AND racknum = '"+racknum+"' " + 
                    "ORDER BY date_recorded ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var output = dbres;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
/* Get All foot count*/
.get('/foot/all/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
        var querry = "SELECT racknum,date_recorded FROM foot " + 
                    "WHERE racknum = '"+racknum+"' " + 
                    "ORDER BY date_recorded ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var output = dbres;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})

/** Get PIR Data Today */
.get('/pirmotion/today/:_num', function(req, res, next) {
      var today = new Date();
      var dateString = today.getFullYear() + "-" + (today.getMonth()+1) +"-"+ today.getDate();
      var racknum = req.params['_num'];
        var querry = "SELECT date_recorded,time_recorded,local_time FROM motion_detect " +
                    "WHERE local_time > '" + dateString + "' AND racknum = '" + racknum + "' " +
                    "ORDER BY local_time ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            //var data = fixTimeZone(dbres.rows);
            res.json({err:null,data:dbres.rows});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
.delete('/pirmotion/today/:_num', function(req, res, next) {
      var today = new Date();
      var dateString = today.getFullYear() + "-" + (today.getMonth()+1) +"-"+ today.getDate();
      var racknum = req.params['_num'];
        var querry = "DELETE FROM motion_detect " + 
                    "WHERE local_time > '" + dateString + "' AND racknum = '" + racknum + "' ";
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
.post('/pirmotion/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var start = data.startDate;
      var end = data.endDate;
        var querry = "SELECT racknum,date_recorded,time_recorded,local_time FROM motion_detect " + 
                    "WHERE local_time > '" + start + "' AND  local_time < '" + end + "' " +
                    "AND racknum = '"+racknum+"' " + 
                    "ORDER BY local_time ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var output = dbres.rows;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})

/** Get All pir sensor data*/
.get('/pirmotion/all/:_num', function(req, res, next) {
      var data = req.body;
      var racknum = req.params['_num'];
      var querry = "SELECT racknum,date_recorded,local_time FROM motion_detect " + 
                    "WHERE racknum = '"+racknum+"' " + 
                    "ORDER BY local_time ASC";
      console.log(querry);
      var client = new Client(settings.database.postgres);
        client.connect();
        client.query(querry, function (err, dbres){
          console.log(err, dbres);
          if(dbres) {
            var output = dbres;
            res.json({err:null,data:output});
          } else {
            res.json({err:err,data:[]});
          }
          client.end();
        });
})
;

module.exports = router;
