var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var settings = require('../settings');
/* GET home page. */
router.get('/', function(req, res, next) {
  var data = {
    title: 'My Smart Rack',
    racks: [],
    active_nav: 'store'
  }
  var fetchRack = "SELECT * from racks ORDER BY racknum ASC";
  const pool = new Pool(settings.database.postgres);
   (async () => {
      const racks = await pool.query(fetchRack);
     data.racks = racks.rows;
     pool.end();
    res.render('store', data);
   })().catch(e => setImmediate(() => {
     console.log("Error Occured While Fetching Racks For Store Page");
     res.send("Error Occured While Fetching Racks For Store Page");
   }))
});

module.exports = router;
