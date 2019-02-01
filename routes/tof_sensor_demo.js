var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
router
.get('/', function (req, res, next) {
  res.redirect('/000001');
})
.post('/api/save_data/:_rack/:_shelf', function(req, res, next) {
    var data = req.body;
    var racknum = req.params['_rack'];
    var shelfnum = req.params['_shelf'];
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