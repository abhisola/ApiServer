var express = require('express');
var router = express.Router();
var { Pool, Client } = require('pg');
var _ = require('lodash');
var settings = require('../settings');
const mailer = require('pug-mailer');
var { DateTime } = require('luxon');

mailer.init({
  service: settings.mail.service,
  auth: settings.mail.auth,
  host: settings.mail.host,
  secure: settings.mail.secureConnection,
  port: settings.mail.port
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
  data.active_nav = 'shelves';
   var racknum = req.params['_num'];
    var fetchRack = "SELECT * from racks WHERE racknum=$1";
    const pool = new Pool(settings.database.postgres);
    (async () => {
      const rack_details = await pool.query(fetchRack, [racknum])
      if (rack_details.rowCount> 0) {
        rack = rack_details.rows[0];
        data.racknum = rack.racknum;
        data.rackname = rack.name;
        data.address = rack.address;
        data.shelf_count = rack.shelves;
        data.timezone = rack.time_zone;
        data.success = true;
      } else {
        data.racknum = racknum;
        data.success = false;
        data.msg = "Sorry the rack with Id " + racknum + " doesnot exist";
      }
      res.render('shelf_board', data);
      pool.end();
    })().catch(e => setImmediate(() => {
      console.log("Error Occured While Fetching Racks For Store Page");
      console.log(e)
    }))
})
.post('/api/detection/range/:_num', function (req, res, next) {
  var data = req.body;
  var racknum = req.params['_num'];
  var start = data.startDate;
  var end = data.endDate;

  var get_detection_details = "SELECT detected_label,pid,shelfnum,score::int FROM detection_details " +
    "WHERE date_recorded >= $1 AND  date_recorded <= $2 " +
          "AND racknum = $3 " +
          "ORDER BY shelfnum ASC, score ASC";
    const pool = new Pool(settings.database.postgres);
    (async () => {
      const detection_details = await pool.query(get_detection_details, [start, end, racknum])
      if (detection_details.rowCount> 0) {
        var grouped_detection = _.groupBy(detection_details.rows, function(b) { return b.shelfnum;});
        res.json({err:null,data:grouped_detection});
      } else {
        res.json({err:detection_details,data:[]});
      }
      pool.end();
    })().catch(e => setImmediate(() => {
      console.log("Error Occured While Getting Detection Details");
      console.log(e)
    }))

})
.post('/api/range/:_num', function(req, res, next) {
  var data = req.body;
  var racknum = req.params['_num'];
  var start = data.startDate;
  var end = data.endDate;

  var get_stock_details = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
    "WHERE date_recorded >= $1 AND  date_recorded <= $2 " +
          "AND racknum = $3 " +
          "ORDER BY date_recorded ASC";
    const pool = new Pool(settings.database.postgres);
    (async () => {
      const stock_details = await pool.query(get_stock_details, [start, end, racknum])
      if (stock_details.rowCount> 0) {
        var grouped_stock = _.groupBy(stock_details.rows, function(b) { return b.shelf_num;});
        res.json({err:null,data:grouped_stock});
      } else {
        res.json({err:stock_details,data:[]});
      }
      pool.end();
    })().catch(e => setImmediate(() => {
      console.log("Error Occured While Getting Stock Details");
      console.log(e)
    }))
})
.get('/api/sendreport/pre/yesterday/:_num', function (req, res, next){
    var racknum = req.params['_num'];
  res.redirect('/shelves/api/sendreport/0/' + racknum);
})
.get('/api/showreport/pre/yesterday/:_num', function (req, res, next) {
  var racknum = req.params['_num'];
  res.redirect('/shelves/api/showreport/0/' + racknum);
})
.get('/api/sendreport/:_days/:_num', function(req, res, next){
    
    var racknum = req.params['_num'];
    var days = parseInt(req.params['_days']);
    days = days + 1;
    var start = getDate(days) + "T00:01:00";
    var end = getDate(days) + "T23:59:00";
  
    var fetchRack = "SELECT * from racks WHERE racknum=$1";
      const pool = new Pool(settings.database.postgres);
      (async () => {
        const rack_details = await pool.query(fetchRack, [racknum])
        if (rack_details.rowCount> 0) {
          var rack = rack_details.rows[0];
          var get_stock_details = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
            "WHERE date_recorded > $1 AND  date_recorded < $2 " +
            "AND racknum = $3 " +
            "ORDER BY date_recorded DESC , shelf_num ASC";
          var subject = '';
          const stock_details = await pool.query(get_stock_details, [start, end, racknum])
          if(stock_details.rowCount>0) {
            var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
            var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
            var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
              var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
              var template_data = {
                rackname : rack.name,
                address : rack.address,
                start: format_start,
                end: format_end,
                timezone: rack.time_zone,
                shelves : [],
                shelf_type : "",
                rack_type : ""
              }
              if (rack.rack_type == "target") {
                  template_data.rack_type = "Target";
              } else if (rack.rack_type == "dollar") {
                  template_data.rack_type = "Dollar General";
                  template_data.shelf_type = "Center ";
              } else {
                  template_data.rack_type = "Demo";
              }
              subject = template_data.rack_type + ' Smart Shelf Out Of Stock Alert For Store: ' + rack.name + ' || ' + format_end + ' '+rack.time_zone;
              _.forEach(stock_details.rows, function (row, i) {
                var found = _.find(template_data.shelves, {
                  'shelf_num': row.shelf_num
                });
                if (!found) {
                  var shelf = {
                    percent: Math.round(100 - parseInt(row.percent)),
                    shelf_num: row.shelf_num,
                    url: row.url,
                    invStat: ""
                  }
                  /*if (shelf.percent > 15 && shelf.percent <= 39) {
                    shelf.invStat = "Low";
                    shelf.percent = 25;
                    template_data.shelves.push(shelf);
                  } else */if (shelf.percent >= 40 && shelf.percent <= 65) {
                    shelf.invStat = "Very Low";
                    shelf.percent = 50;
                    template_data.shelves.push(shelf);
                  } else if (shelf.percent > 65 && shelf.percent <= 97) {
                    shelf.invStat = "Extremely Low"
                    shelf.percent = 75;
                    template_data.shelves.push(shelf);
                  } else if (shelf.percent >= 98 && shelf.percent <= 100) {
                    shelf.invStat = "Empty"
                    shelf.percent = 100;
                    template_data.shelves.push(shelf);
                  } 
                }
              });
              template_data.shelves = _.sortBy(template_data.shelves, ['shelf_num']);
              sendData(racknum, start, template_data.shelves);
              if (template_data.shelves.length > 0) {
                var get_products = "SELECT * from products"
                const product_data = await pool.query(get_products);

                var get_detection_details = "SELECT detected_label,pid,shelfnum,score::int FROM detection_details " +
                "WHERE date_recorded >= $1 AND  date_recorded <= $2 " +
                      "AND racknum = $3 " +
                      "ORDER BY shelfnum ASC, score ASC";
                const detection_details = await pool.query(get_detection_details, [start, end, racknum])
                if (detection_details.rowCount> 0) { 
                  var grouped_detection = _.groupBy(detection_details.rows, function(b) { return b.shelfnum;});
                  template_data.shelves.forEach(shelf => {
                    product_Name = get_product_name(grouped_detection, shelf, product_data.rows);
                    if (product_Name != '') {
                      shelf.product = product_Name;
                    } else shelf.product = '( '+ product_Name + ' )';
                    
                  });
                }
                mailer.send({
                  from: sent_from,
                  to: sent_to, //List of recievers,
                  subject: subject,
                  template: 'shelf',
                  data: template_data
                })
                .then(resp=> {
                  res.render('../mails/templates/shelf', template_data);
                })
                .catch(err=>{
                  res.json({
                    success: false,
                    msg: err,
                    data: []
                  });
                });
              }
              else {
                res.json({
                  success: true,
                  msg: 'No Shelves Are Empty',
                  data: []
                });
              }
            } else {
              res.json({ success: false, msg: 'No Data Found for range : '+start+' To '+end, data: [] });
            }
        } else {
          res.json({
            success: false,
            msg: 'Rack Not Found',
            data: []
          });
        }
        pool.end();
      })().catch(e => setImmediate(() => {
        console.log("Error Occured While Sending Reports");
        console.log(e)
      }))
})
.get('/api/showreport/:_days/:_num', function (req, res, next) {
     
  var racknum = req.params['_num'];
  var days = parseInt(req.params['_days']);
  days = days + 1;
  var start = getDate(days) + "T00:01:00";
  var end = getDate(days) + "T23:59:00";

  var fetchRack = "SELECT * from racks WHERE racknum=$1";
    const pool = new Pool(settings.database.postgres);
    (async () => {
      const rack_details = await pool.query(fetchRack, [racknum])
      if (rack_details.rowCount> 0) {
        var rack = rack_details.rows[0];
        var get_stock_details = "SELECT racknum,shelf_num,percent_full*100 AS percent,date_recorded,url FROM shelf_stock " +
          "WHERE date_recorded > $1 AND  date_recorded < $2 " +
          "AND racknum = $3 " +
          "ORDER BY date_recorded DESC , shelf_num ASC";
        var subject = '';
        const stock_details = await pool.query(get_stock_details, [start, end, racknum])
        if(stock_details.rowCount>0) {
          var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
          var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
          var format_start = DateTime.fromISO(start).toFormat('LLL dd, HH:mma');
            var format_end = DateTime.fromISO(end).toFormat('LLL dd, HH:mma');
            var template_data = {
              rackname : rack.name,
              address : rack.address,
              start: format_start,
              end: format_end,
              timezone: rack.time_zone,
              shelves : [],
              shelf_type : "",
              rack_type : ""
            }
            if (rack.rack_type == "target") {
                template_data.rack_type = "Target";
            } else if (rack.rack_type == "dollar") {
                template_data.rack_type = "Dollar General";
                template_data.shelf_type = "Center ";
            } else {
                template_data.rack_type = "Demo";
            }
            subject = template_data.rack_type + ' Smart Shelf Out Of Stock Alert For Store: ' + rack.name + ' || ' + format_end + ' '+rack.time_zone;
            _.forEach(stock_details.rows, function (row, i) {
              var found = _.find(template_data.shelves, {
                'shelf_num': row.shelf_num
              });
              if (!found) {
                var shelf = {
                  percent: Math.round(100 - parseInt(row.percent)),
                  shelf_num: row.shelf_num,
                  url: row.url,
                  invStat: ""
                }
                /*if (shelf.percent > 15 && shelf.percent <= 39) {
                  shelf.invStat = "Low";
                  shelf.percent = 25;
                  template_data.shelves.push(shelf);
                } else */if (shelf.percent >= 40 && shelf.percent <= 65) {
                  shelf.invStat = "Very Low";
                  shelf.percent = 50;
                  template_data.shelves.push(shelf);
                } else if (shelf.percent > 65 && shelf.percent <= 97) {
                  shelf.invStat = "Extremely Low"
                  shelf.percent = 75;
                  template_data.shelves.push(shelf);
                } else if (shelf.percent >= 98 && shelf.percent <= 100) {
                  shelf.invStat = "Empty"
                  shelf.percent = 100;
                  template_data.shelves.push(shelf);
                } 
              }
            });
            template_data.shelves = _.sortBy(template_data.shelves, ['shelf_num']);
            if (template_data.shelves.length > 0) {
              var get_products = "SELECT * from products"
              const product_data = await pool.query(get_products);

              var get_detection_details = "SELECT detected_label,pid,shelfnum,score::int FROM detection_details " +
              "WHERE date_recorded >= $1 AND  date_recorded <= $2 " +
                    "AND racknum = $3 " +
                    "ORDER BY shelfnum ASC, score ASC";
              const detection_details = await pool.query(get_detection_details, [start, end, racknum])
              if (detection_details.rowCount> 0) { 
                var grouped_detection = _.groupBy(detection_details.rows, function(b) { return b.shelfnum;});
                template_data.shelves.forEach(shelf => {
                  shelf.product = '( '+ get_product_name(grouped_detection, shelf, product_data.rows) + ' )'
                });
              }
              res.render('../mails/templates/shelf', template_data);
            }
            else {
              res.json({
                success: true,
                msg: 'No Shelves Are Empty',
                data: []
              });
            }
          } else {
            res.json({ success: false, msg: 'No Data Found for range : '+start+' To '+end, data: [] });
          }
      } else {
        res.json({
          success: false,
          msg: 'Rack Not Found',
          data: []
        });
      }
      pool.end();
    })().catch(e => setImmediate(() => {
      console.log("Error Occured While Showing Reports");
      console.log(e)
    }))
})
.get('/api/restock/generate/:_days', function (req, res, next) {
      var days = parseInt(req.params['_days']);
      days = days + 1;
      var start = getDate(days) + "T00:01:00";
      var end = getDate(days) + "T23:59:00";
      var fetchRack = "SELECT * from racks ORDER BY racknum ASC";
      var fetchShelves = "SELECT racknum,shelf_num,ROUND(percent_full*100,2) AS percent,date_recorded::text,url FROM shelf_stock " +
        "WHERE date_recorded > $1 AND  date_recorded < $2 " +
        "AND racknum = $3 AND shelf_num = $4" +
        "ORDER BY shelf_num ASC, date_recorded ASC";
      const pool = new Pool(settings.database.postgres);
      const thresh = 25;
      (async () => {
        var data = [];
        const dbresRacks = await pool.query(fetchRack)
        for (let rack of dbresRacks.rows) {
          console.log('RackNum: '+rack.racknum);
          for(j=0;j<rack.shelves;j++) {
            const dbresShelves = await pool.query(fetchShelves, [start, end, rack.racknum, j]);
            let dbrows = dbresShelves.rows;
            //console.log('Shelf: ' + JSON.stringify(dbrows));
            if (dbresShelves.rowCount > 0) {
              let initial = dbrows[0];
              for (i = 0; i < dbrows.length; i++) {
                let point = dbrows[i];
                /*console.log('****** Looping *** ***');
                console.log('Comparing -> Initial: '+JSON.stringify(initial));
                console.log('With -> Point: '+JSON.stringify(point));*/
                if(point) {
                  let restock = point.percent - initial.percent; // Restock
                  let sold = initial.percent - point.percent; // Sold
                 /* console.log('Restock: '+restock);
                  console.log('Sold: '+sold);*/
                  let temp_from = initial.date_recorded;
                  let temp_to = point.date_recorded;
                  let dt = {
                    rack: initial.racknum,
                    shelf: initial.shelf_num,
                    from_date : initial.date_recorded,
                    from_per: parseFloat(initial.percent),
                    from_url: initial.url,
                    to_url: point.url
                  };
                  if (restock > 0 && restock > thresh) {
                    //console.log('*** Inside Restock ***');
                    let diff_ms = new Date(temp_to).getTime() - new Date(temp_from).getTime();
                    let hour = diff_ms / (1000 * 60 * 60);
                    dt.isRestock = true;
                    dt.to_date = point.date_recorded;
                    dt.to_per = parseFloat(point.percent);
                    dt.hours = parseFloat(hour);
                    data.push(dt);
                    initial = point;
                  }
                  if(sold > 0 && sold > thresh) {
                    //console.log('*** Inside Sold ***');
                    let diff_ms = new Date(temp_to).getTime() - new Date(temp_from).getTime();
                    let hour = diff_ms / (1000 * 60 * 60);
                    dt.isRestock = false;
                    dt.to_date = point.date_recorded;
                    dt.to_per = parseFloat(point.percent);
                    dt.hours = parseFloat(hour);
                    data.push(dt);
                    initial = point;
                  }
                  if(point.percent < initial.percent) {
                    initial = point;
                  }
                  //console.log('Data Status: '+JSON.stringify(data));
                  //console.log();
                }
              }
            }
          }
          //console.log();
          //console.log();
        }
        var addToRestock = 'INSERT INTO restock ("racknum", "shelf_num", "from_date", "to_date", "from_percent", "to_percent", "hours", "isrestock") VALUES($1,$2,$3,$4,$5,$6,$7,$8)'
        var isDuplicate = 'Select * from restock WHERE racknum=$1 AND shelf_num=$2 AND from_date=$3 AND to_date=$4 AND from_percent=$5 '+
        'AND to_percent=$6 AND hours=$7 AND isrestock=$8'
        console.log(data);
        var executed = [];
        var duplicate = [];
        for(let row of data) {
          const dup = await pool.query(isDuplicate, [row.rack, row.shelf, row.from_date, row.to_date, row.from_per, row.to_per, row.hours, row.isRestock]);
          if(dup.rowCount > 0) {
            duplicate.push(row);
          } else {
            const q = await pool.query(addToRestock, [row.rack, row.shelf, row.from_date, row.to_date, row.from_per, row.to_per, row.hours, row.isRestock]);
            row.rowsAdded = q.rowCount;
            executed.push(row);
          }
        }
        pool.end()
        res.json({success:true,msg:'Restock Response Processed Successfully for '+start, data:{duplicate: duplicate, executed: executed}});
      })().catch(e => setImmediate(() => {console.error(e);}))
})
.get('/restock/:_num', function (req,res,next) {
  var racknum = req.params['_num'];
  var fetchRack = "SELECT * from racks WHERE racknum=$1";
  const pool = new Pool(settings.database.postgres);
  (async () => {
    const dbresRacks = await pool.query(fetchRack, [racknum]);
    if (dbresRacks.rowCount > 0) {
      var rack = dbresRacks.rows[0];
      rack.success = true;
      rack.title = "Restock";
      rack.active_nav = 'restock';
      res.render('restock', rack);
    } else {
      res.render('restock', {
        success: false,
        msg: 'Rack Was Not Found!'
      })
    }
    pool.end()
  })().catch(e => setImmediate(() => {
    console.error(e);
  }))
})
.post('/api/restock/range/:_num', function(req, res, next){
  var racknum = req.params['_num'];
  var resData = req.body;
  var start = resData.startDate;
  var end = resData.endDate;
  var fetchRack = "SELECT * from racks WHERE racknum=$1";
  var fetchRestockData = "SELECT shelf_num,to_date,hours,isrestock "+
  "FROM restock WHERE racknum=$1 AND to_date >= $2 AND to_date <= $3 AND isrestock ORDER BY shelf_num ASC"
    var query = "SELECT shelf_num,to_date,hours,isrestock " +
      "FROM restock WHERE racknum='" + racknum + "' AND to_date >= '" + start + "' AND to_date <= '" + end + "' AND isrestock ORDER BY shelf_num ASC, to_date DESC"
      console.log(query);
  const pool = new Pool(settings.database.postgres);
  var template_data = {
    rack : {},
    restock : [],
    success : true,
    msg : ''
  };
  (async () => {
    const dbresRacks = await pool.query(fetchRack,[racknum]);
    if(dbresRacks.rowCount > 0) {
      template_data.rack= dbresRacks.rows[0];
      const dbRestock = await pool.query(fetchRestockData,[racknum,start,end]);
       res.json({
         success: true,
         msg: 'Found data',
         data: dbRestock.rows
       });
    }
    else {
       res.json({success:false,msg:'Rack Was Not Found!', data:[]});
    }
    pool.end()
    //res.json({success:true,msg:'Restock Response Processed Successfully for '+start, data:[]});
  })().catch(e => setImmediate(() => {console.error(e);}))
})
.get('/restock/response/dashboard', function(req, res, next){
  data.active_nav = 'response';
  var fetchRack = "SELECT * from racks ORDER BY racknum ASC";
  const pool = new Pool(settings.database.postgres);
  (async () => {
      const dbresRacks = await pool.query(fetchRack);
      var data = {};
      data.racks = dbresRacks.rows;
      data.title = "Response Board";
      data.active_nav = "response";
      res.render('response_board', data);
    pool.end()
  })().catch(e => setImmediate(() => {
    console.error(e);
  }))
})
.post('/api/restock/response', function (req, res, next) {
  var resData = req.body;
  var start = resData.startDate;
  var end = resData.endDate;
  var hours = resData.hours;
  var percent = (100 - resData.percent);
  var fetchResponseData = "select * from restock where from_date > $1 and from_date < $2 and hours > $3 and from_percent < $4 and isrestock";
  const pool = new Pool(settings.database.postgres);
  (async () => {
    const dbResponse = await pool.query(fetchResponseData, [start, end, hours, percent]);
    var output = _.groupBy(dbResponse.rows, function (b) {
      return b.racknum;
    });
    console.log(dbResponse);
    if (dbResponse.rowCount > 0) {
      res.json({
        success: true,
        msg: 'Found data',
        data: output
      });
    }
    else {
      res.json({ success: false, msg: 'Nothing Found!', data: [] });
    }
    pool.end()
    //res.json({success:true,msg:'Restock Response Processed Successfully for '+start, data:[]});
  })().catch(e => setImmediate(() => { console.error(e); }))
})
;
function sendData(racknum, date, shelf_data, res) {
  var shelves = ""
  shelf_data.forEach(shelf => {
    shelves += shelf.shelf_num + ","
  });
  if (shelf_data.length > 0) {
    shelves = shelves.substring(0, shelves.length-1)
  }
  
  var insert_report_data = "INSERT INTO public.report_alerts_generated ("
        +"racknum, storenum, date_recorded, shelves) VALUES ($1, $2, $3, $4)"
         "return rid;";
  var check_if_inserted = "Select * from public.report_alerts_generated where racknum=$1 AND storenum=$2 AND date_recorded=$3"
  var get_store_num = "Select storenum from racks where racknum=$1";
  var alter_store = "UPDATE public.report_alerts_generated SET shelves=$1 WHERE racknum=$2 AND storenum=$3 AND date_recorded=$4"
  const pool = new Pool(settings.database.postgres);
  (async () => {
    const storenum_data = await pool.query(get_store_num, [racknum])
    storenum = storenum_data.rows[0].storenum;
    const inserted = await pool.query(check_if_inserted, [racknum, storenum, date])
    var alerts = [];
    if(inserted.rowCount <= 0) {
      console.log("Inserting Alerts Generated Row");
      alerts = await pool.query(insert_report_data,[racknum, storenum, date, shelves]);
    } else {
      console.log("Updating Alerts Generated Row")
      alerts = await pool.query(alter_store,[shelves,racknum, storenum, date]);
    }
    pool.end();
  })().catch(e => setImmediate(() => {
    console.log("Error Occured While Saving Alert Generated");
    console.log(e)
  }))
}
function getDate(days) {
  var today = new Date();
  var mius_days = DateTime.fromISO(today.toISOString()).minus({days:days});
  var year = mius_days.year;

  var month = mius_days.month;
  month = (month < 10 ? "0" : '') + month;

  var day = mius_days.day;
  day = (day < 10 ? "0" : '') + day;

  return year + "-" + month + "-" + day;
}
function get_product_name(detection, shelf_data, products) {
    json = detection
    shelf = shelf_data.shelf_num
    var keys = Object.keys(json);
    
    detected_labels = [];
    for (let k = 0; k < keys.length; k++) {
      var shelf_detect = Object.keys(json)[k];
      if(shelf+'' == shelf_detect) {
        var sorted = json[shelf].sort(function (shelf) {
          return shelf['score']
        })
        
        for (let i = 0; i < sorted.length; i++) {
          for (let j = 0; j < detected_labels.length; j++) {
            if(sorted[i]['detected_label'] != detected_labels[j])
              detected_labels.push(sorted[i]['detected_label'])
          }
          if(detected_labels.length <= 0) 
            detected_labels.push(sorted[i]['detected_label'])
        }
      }
    }
    
    detected_label = ''
    for (let i = 0; i < detected_labels.length; i++) {
      detected_label += getDisplayName(detected_labels[i], products);
    }
    return detected_label;
}

function getDisplayName(label, products) {
  product_name = '';
  for (let i = 0; i < products.length; i++) {
    if(products[i]['plabel'] == label)
      product_name = products[i]['pname'];
  }
  return product_name;
}

module.exports = router;
