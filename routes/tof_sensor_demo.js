var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
var { DateTime } = require('luxon');
var data = {
  title : "Smart Pringles Demo"
};
router
.get('/', function (req, res, next) {
  res.redirect('/tof_sensor_demo/TOF001');
})
.get('/:_num', function(req, res,next) {
  var racknum = req.params['_num'];
   var fetchRack = "SELECT * from tof_racks WHERE racknum='" + racknum + "'";
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
             data.timezone = rack.time_zone;
             data.success = true;
           } else {
             data.racknum = racknum;
             data.success = false;
             data.msg = "Sorry the Pringles Rack with Id " + racknum + " doesnot exist";
           }
         }else {
             data.success = false;
             data.msg = "Sorry Something went wrong serverside";
         }
         res.render('tof_demo_board', data);
         client.end();
   })
})
.post('/api/:_rack/:_shelf', function(req, res, next) {
    var data = req.body;
    var racknum = req.params['_rack'];
    var shelfnum = req.params['_shelf'];
    var todaysDate = getDateTime();
    var insert_tofData = "INSERT INTO tof_shelf_stock ("
        +"racknum, shelfnum, data, date_recorded, local_time) VALUES ($1, $2, $3, $4, $5)";
    var fetch_timeDiff = "SELECT time_diff from tof_racks where racknum=$1 limit 1";
    const pool = new Pool(settings.database.postgres );
    console.log(insert_tofData);
    console.log(data);
    (async () => {
        const time_diff = await pool.query(fetch_timeDiff,[racknum]);
        const row = time_diff.rowCount>0?time_diff.rows[0]:null;
        if(row) {
          zone = row.time_diff;
        } else {
          zone = 0;
        }
        var minus = Number(zone) < 0 ? true : false;
        var str = zone + '';
        var has_minutes = str.indexOf('.') != -1? true : false ;
        var min = 0;
        if(has_minutes) min = str.substr(str.indexOf('.')+1, str.length)
        hour = minus ? str.substr(1, str.indexOf('.')-1) : str.substr(0, str.indexOf('.')-1)
        var local_time = minus ? DateTime.local().minus({ hours: hour, minutes: min }).toFormat('yyyy-LL-dd TT') : DateTime.local().plus({ hours: hour, minutes: min }).toFormat('yyyy-LL-dd TT');
        const querry = await pool.query(insert_tofData,[racknum, shelfnum, data, todaysDate, local_time]);
        pool.end();
        if(querry) {
          res.json({err:null,data:[], msg: "Tof Rack Stock Saved For Shelf:"+shelfnum+" Of Rack:"+racknum});
          console.log("Tof Rack Stock Saved For Shelf:"+shelfnum+" Of Rack:"+racknum)
        } else {
          res.json({err:null,data:[], msg: "Tof Rack Data Not Saved"});
          console.log("Error Saving Data For TOF Rack Shelf:"+shelfnum+" Of Rack:"+racknum)
          console.log(querry);
        }
        
     })().catch(e => setImmediate(() => {
       console.log("Error Occured While Inserting Data In TOF Rack with racknum: "+racknum);
       console.log(e)
       res.send("Error Occured While Inserting Data In TOF Rack with racknum:"+racknum);
     }))
  })
.put('/api/:_rack', function (req, res, next) {
    var data = req.body;
    var racknum = req.params['_rack'];
    var startDate = data.startDate;
    var endDate = data.endDate;
    var fetch_data = "Select shelfnum, racknum, date_recorded::text, local_time::text,data,tsid from tof_shelf_stock where racknum=$1 and date_recorded>=$2 and date_recorded<=$3"
        +" Order By shelfnum ASC, date_recorded DESC";
        const pool = new Pool(settings.database.postgres);
        (async () => {
          const tof_data = await pool.query(fetch_data, [racknum, startDate, endDate]);
          pool.end();
          res.json({err:null, data:tof_data.rows,msg:"Found tof stock data."});
        })().catch(e => setImmediate(()=>{
          console.log("Error Occured While Fetching Stock for Pringles");
          console.log(e)
          res.send("Error Occured While Fetching Stock for Pringles");
        }))
    
})
.get('/api/config/:_rack/:_shelf', function (req, res, next) {
  var racknum = req.params['_rack'];
  var shelfnum = req.params['_shelf'];
  var fetch_data = "Select * from shelf_config_tof where racknum=$1 and shelfnum=$2 Limit 1";
      const pool = new Pool(settings.database.postgres);
      (async () => {
        const config_data = await pool.query(fetch_data, [racknum, shelfnum]);
        pool.end();
        res.json({err:null, data:config_data.rows[0],msg:"Found tof stock data."});
      })().catch(e => setImmediate(()=>{
        console.log("Error Occured While Fetching Stock for Pringles");
        console.log(e)
        res.send("Error Occured While Fetching Stock for Pringles");
      }))
})
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
  module.exports = router;