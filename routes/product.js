var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
var data = {
  title : "Smart Rack Products",
  active_nav : "product"
};
router
 .get('/api/', function(req, res, next) {
    var get_products = "SELECT * from products"
    const pool = new Pool(settings.database.postgres );
    (async () => {
        const product_data = await pool.query(get_products);
        pool.end();
        res.json({err:null,data:product_data.rows, msg: "We Found Products"});
     })().catch(e => setImmediate(() => {
       console.log("Error Occured While Fetching Products");
       console.log(e)
       res.send("Error Occured While Fetching Products");
     }))
 })
  module.exports = router;