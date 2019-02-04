var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
const mailer = require('pug-mailer');
var { DateTime } = require('luxon');

router
.get('/:_num', function(req, res,next) {
  var racknum = req.params['_num'];
  var fetchRack = "SELECT * from racks WHERE racknum=$1";
  const pool = new Pool(settings.database.postgres);
  (async () => {
    const dbresRacks = await pool.query(fetchRack, [racknum]);
    if (dbresRacks.rowCount > 0) {
      var rack = dbresRacks.rows[0];
      rack.success = true;
      rack.title = "Lost Sales";
      res.render('lost_sales', rack);
    } else {
      res.render('lost_sales', {
        success: false,
        msg: 'Rack Was Not Found!'
      })
    }
    pool.end()
  })().catch(e => setImmediate(() => {
    console.error(e);
  }))
})
.post('/:_num', function(req, res,next) {
	var racknum = req.params['_num'];
	var resData = req.body;
  	var start = resData.startDate;
  	var fetchLossReport = "SELECT * from racks WHERE racknum=$1";
})