var { Pool, Client } = require('pg');
var _ = require('lodash');
var target = {};
var settings = require('../settings');
var { DateTime } = require('luxon');

target.addData = function(data, callback) {
    var todaysDate = getDateTime();
    var racknum = data.racknum;
    var time = Math.round((data.time) / 1000);
    var querry = "INSERT INTO target (racknum, date_recorded, time_recorded)" 
                + " VALUES('"+racknum+"','"+todaysDate+"',"+time+")" ;
    var client = new Client(settings.database.postgres);
       client.connect();
       client.query(querry, function (err, dbres){
          if(dbres) {
              callback(null, {data: dbres, querry: querry})
          } else {
              callback(err, {data: querry})
          }

          client.end();
        });
}

target.addFootData = function(rackid, callback) {
    var todaysDate = getDateTime();
    var racknum = rackid;
    var querry = "INSERT INTO foot (racknum, date_recorded)" 
                + " VALUES('"+racknum+"','"+todaysDate+"')" ;
    var client = new Client(settings.database.postgres);
       client.connect();
       client.query(querry, function (err, dbres){
          if(dbres) {
              callback(null, {data: dbres, querry: querry})
          } else {
              callback(err, {data: querry})
          }

          client.end();
        });
}

target.addMotionData = function(data, callback) {
    var todaysDate = getDateTime();
    var iso = todaysDate.replace(' ','T');
    var racknum = data.racknum;
    var time = data.time;
    var zone = data.time_diff;
    var minus = Number(zone) < 0 ? true : false;
    var str = zone + '';
    var has_minutes = str.indexOf('.') != -1? true : false ;
    var min = 0;
    if(has_minutes) min = str.substr(str.indexOf('.')+1, str.length)
    hour = minus ? str.substr(1, str.indexOf('.')-1) : str.substr(0, str.indexOf('.')-1)
    var local_time = minus ? DateTime.local().minus({ hours: hour, minutes: min }).toFormat('yyyy-LL-dd TT') : DateTime.local(today).plus({ hours: hour, minutes: min }).toFormat('yyyy-LL-dd TT');
   /* var local_time = DateTime.fromISO(iso).minus({
        hours: 5
    }).toFormat('yyyy-LL-dd TT');*/
    var querry = "INSERT INTO motion_detect (racknum, date_recorded, time_recorded, local_time)"
                + " VALUES('"+racknum+"','"+todaysDate+"','"+time+"','"+local_time+"')" ;
    console.log(querry)
   var client = new Client(settings.database.postgres);
       client.connect();
       client.query(querry, function (err, dbres){
          if(dbres) {
              callback(null, {data: dbres, querry: querry});
          } else {
              callback(err, {data: querry});
          }
          client.end();
        });
}
function getDateTime() {
    var today = new Date();
    var hour = today.getHours();
    hour = (hour < 10 ? "0" : '') + hour;

    var min = today.getMinutes();
    min = (min < 10 ? "0" : '') + min;

    var sec = today.getSeconds();
    sec = (sec < 10 ? "0" : '') + sec;

    var year = today.getFullYear();

    var month = today.getMonth()+1;
    month = (month < 10 ? "0" : '') + month;

    var day = today.getDate();
    day = (day < 10 ? "0" : '') + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec
}
module.exports = target;