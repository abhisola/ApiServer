var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
var data = {
  title : "Smart Rack Location",
  active_nav : "location"
};
router
.get('/', function (req, res, next) {
  res.redirect('location/000001');
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
               data.timezone = rack.time_zone;
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
           res.render('location', data);
           client.end();
     })
 })
 .get('/api/location/:_num', function(req, res, next) {
    var racknum = req.params['_num'];
    var get_location = "SELECT * from location where racknum=$1 Order By lid desc limit 30"
    const pool = new Pool(settings.database.postgres );
    (async () => {
        const loc_data = await pool.query(get_location, [racknum]);
        pool.end();
        console.log(loc_data.rows);
        res.json({err:null,data:loc_data.rows, msg: "We Found Location Data"});
     })().catch(e => setImmediate(() => {
       console.log("Error Occured While Fetching Racks For Store Page");
       console.log(e)
       res.send("Error Occured While Fetching Racks For Store Page");
     }))
 })
 .post('/api/location/:_num', function(req, res, next) {
    var data = req.body;
    var racknum = req.params['_num'];
  
    var insert_location = "INSERT INTO public.location ("
        +"lat, lng, racknum, accuracy) VALUES ($1, $2, $3, $4)"
         "returning lid;";
    const pool = new Pool(settings.database.postgres );
    console.log(insert_location);
    (async () => {
        const racks = await pool.query(insert_location,[data.location.lat, data.location.lng, racknum, data.accuracy]);
        pool.end();
        console.log(racks);
        res.json({err:null,data:racks, msg: "Loation Saved"});
     })().catch(e => setImmediate(() => {
       console.log("Error Occured While Fetching Racks For Store Page");
       console.log(e)
       res.send("Error Occured While Fetching Racks For Store Page");
     }))
  })

  module.exports = router;