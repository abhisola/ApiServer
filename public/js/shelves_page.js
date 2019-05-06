// configure charts
var products = [];
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation = false;
var currData = new Array();
var charts = [];

function customTooltips(tooltip) {
  var tooltipEl = document.getElementById('chartjs-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.innerHTML = "<img style='width:400px;height:auto;'></img><div>percent:<span id='val'></span><span style='padding-left: 20px;' id='date'></span></div>"
    document.body.appendChild(tooltipEl);
  }else {
    tooltipEl.querySelector('img').src = '';
    tooltipEl.querySelector('span#val').innerHTML = '';
    tooltipEl.querySelector('span#date').innerHTML = '';
  }
  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }
  // Set caret Position
  tooltipEl.classList.remove('above', 'below', 'no-transform');
  if (tooltip.yAlign) {
    tooltipEl.classList.add(tooltip.yAlign);
  } else {
    tooltipEl.classList.add('no-transform');
  }
  // Set Text
  if (tooltip.body) {
    var tableRoot = tooltipEl.querySelector('img');
    var val = tooltipEl.querySelector('span#val');
    var date = tooltipEl.querySelector('span#date');
    var ttImg = this._data.datasets[0].images[tooltip.dataPoints[0].index];
    val.innerHTML = tooltip.dataPoints[0].yLabel;
    date.innerHTML = 'date: '+tooltip.dataPoints[0].xLabel;
    tableRoot.src = ttImg;
  }
  var position = this._chart.canvas.getBoundingClientRect();
  var sTop = $(window).scrollTop();
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = position.left + tooltip.caretX + 'px';
  tooltipEl.style.top = sTop + tooltip.caretY + 'px';
  tooltipEl.style.fontFamily = tooltip._fontFamily;
  tooltipEl.style.fontSize = tooltip.fontSize;
  tooltipEl.style.fontStyle = tooltip._fontStyle;
  tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
}

function getProductName(label) {
  product_name = '';
  for (let i = 0; i < products.length; i++) {
    if(products[i]['plabel'] == label)
      product_name = products[i]['pname'];
  }
  return product_name;
}

function updateShelf(json) {
for(m=0;m<charts.length;m++){
if(charts[m]) {
  charts[m].destroy();
}
}
charts = [];
  var keys = Object.keys(json);
  for(j=0; j<keys.length; j++) {
    var shelf = Object.keys(json)[j];
    var labels = new Array();
    var data = new Array();
    var images = new Array();
    $.each(json[shelf], function(k, report) {
      labels.push( sanatizeTimeAndFormat(report['date_recorded']) );
      data.push( parseFloat(report['percent']).toFixed(2) );
      images.push( report['url'] );
    });
    // now build a div from images arr
    // count total number images
    imagesTotal = images.length;
    // determine width of div to write to
    thumbsDivWidth = $("#shelf"+shelf).width();
    // calculate the number of images to fit in that div
    thumbsNum = Math.floor(thumbsDivWidth / 150);
    // create (or clear out if it already exists) thumbs div
    if($("#thumbs"+shelf).length) {
      $("#thumbs"+shelf).empty();
    } else {
      $("#shelf"+shelf+" .stock_chart.col-md-12").after("<div id='thumbs"+shelf+"' class='thumbs col-md-12 nolpadding norpadding'></div>");
    }
    // create a new array with that number of images
    thumbs = new Array();
    thumbsDates = new Array();
    // if there aren't enough thumbs to fill the div, just write what we have
    if( imagesTotal < thumbsNum ) {
      skipNum = 0;
      thumbsNum = imagesTotal;
      for(i=0; i<imagesTotal+1; i++) {
        thumbs.push(images[i]);
        thumbsDates.push(labels[i]);
      }
    } else {
      skipNum = Math.floor(imagesTotal / (thumbsNum - 1));
      // if the div exists, empty it
      for(i=0; i<imagesTotal+1; i=i+skipNum) {
        if(imagesTotal - i < skipNum) {
          thumbs.push(images[imagesTotal-1]);
          thumbsDates.push(labels[imagesTotal-1]);
        } else {
          thumbs.push(images[i]);
          thumbsDates.push(labels[i]);
        }
      }
    }
    // make thumbnail mouseover work
    // write image thumbnails to div in correct width
    for(i=0; i<thumbsNum; i++) {
      $("#thumbs"+shelf).append("<span class='thumb-wrap'><a href='"+thumbs[i]+"'><img class='thumb' src="+thumbs[i]+" width='148' title='"+thumbs[i]+"'></a></span>");
    }

    var ctx_data = $("#chart"+shelf).get(0).getContext("2d");
    var chart = new Chart(ctx_data, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: "rgba(151,187,205,0.5)",
          borderColor: "rgba(151,187,205,0.8)",
          images: images
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          enabled: false,
          mode: 'index',
          position: 'nearest',
          custom: customTooltips
        },
        scales: {
          yAxes: [{
            ticks: {
              max: 100,
              min: 0,
              stepSize: 20
            },
            scaleLabel: {
              display: true,
              labelString: 'Percent Full'
            }
          }],
          xAxes: []
        },
        mounted() {
            this.renderChart(this.renderData, this.renderOptions);
          },
          watch: {
            chartData() {
              this.renderOptions.maintainAspectRatio = true;
              this.renderChart(this.renderData, this.renderOptions);
            }
          }
      }
    });
charts.push(chart);
  }
  $('img.thumb')
    .wrap('<span style="display:inline-block"></span>')
    .css('display', 'block')
    .parent()
    .zoom({magnify: '.2'});
  hideSpinner();
}

function updateDetection(json){
  var keys = Object.keys(json);
  for(j=0; j<keys.length; j++) {
    var shelf = Object.keys(json)[j];
    var detection_txt = $('span#detection'+shelf);
    var sorted = json[shelf].sort(function (shelf) {
      return shelf['score']
    })
    detected_labels = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = 0; j < detected_labels.length; j++) {
        if(sorted[i]['detected_label'] != detected_labels[j])
          detected_labels.push(sorted[i]['detected_label'])
      }
      if(detected_labels.length <= 0) 
        detected_labels.push(sorted[i]['detected_label'])
    }
    detected_label = ''
    for (let i = 0; i < detected_labels.length; i++) {
      detected_label += getProductName(detected_labels[i]);
    }
    if (detected_label != '')
      detection_txt.html('( '+detected_label+' )');
    else 
      detection_txt.html(detected_label);
  }
}

function getURL() {
  return used_host + "/shelves/api/range/" + $("#rackNum").val();
}
function getDetectionURL() {
  return used_host + "/shelves/api/detection/range/" + $("#rackNum").val();
}
function getProductURL() {
  return used_host + "/product/api";
}
function fetchProducts() {
  var start = $("#startDate").val()+"T00:00:00";
  var end = $("#endDate").val()+"T23:59:00";
  var arr = { startDate: start, endDate: end };
  $.ajax({
    cache : false,
    type : 'GET',
    url: getProductURL(),
    xhrFields: {
      // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
      // This can be used to set the 'withCredentials' property.
      // Set the value to 'true' if you'd like to pass cookies to the server.
      // If this is enabled, your server must respond with the header
      // 'Access-Control-Allow-Credentials: true'.
      withCredentials: false
    },
    success: function (data) {
      console.log("Detection Data: ");
      console.log(JSON.stringify(data));
      if(data.err) {
        console.log('Serverside Error');
      } else {
        if($.isEmptyObject(data.data)) {
        } else {
          products = data.data;
          console.log(products)
        }
      } 
    },
    error: function(data) {
      console.log("Error");
      console.log(data);
    }
  });
  return false;
}
function fetchDetection() {
  set_detection_text_blank();
  var start = $("#startDate").val()+"T00:00:00";
  var end = $("#endDate").val()+"T23:59:00";
  var arr = { startDate: start, endDate: end };
  $.ajax({
    cache : false,
    type : 'POST',
    url: getDetectionURL(),
    dataType: "json",
    data : JSON.stringify(arr),
    contentType: 'application/json',
    xhrFields: {
      // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
      // This can be used to set the 'withCredentials' property.
      // Set the value to 'true' if you'd like to pass cookies to the server.
      // If this is enabled, your server must respond with the header
      // 'Access-Control-Allow-Credentials: true'.
      withCredentials: false
    },
    headers : {
      "accept": "application/json",
    },
    success: function (data) {
      if(data.err) {
        console.log('Serverside Error');
      } else {
        if($.isEmptyObject(data.data)) {
        } else {
          updateDetection(data.data);
        }
      } 
    },
    error: function(data) {
      console.log("Error");
      console.log(data);
    }
  });
  return false;
}
function fetchData() {
  showSpinner();
  $("canvas").empty();
  var start = $("#startDate").val()+"T00:00:00";
  var end = $("#endDate").val()+"T23:59:00";
  var arr = { startDate: start, endDate: end };
  $.ajax({
    cache : false,
    type : 'POST',
    url: getURL(),
    dataType: "json",
    data : JSON.stringify(arr),
    contentType: 'application/json',
    xhrFields: {
      // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
      // This can be used to set the 'withCredentials' property.
      // Set the value to 'true' if you'd like to pass cookies to the server.
      // If this is enabled, your server must respond with the header
      // 'Access-Control-Allow-Credentials: true'.
      withCredentials: false
    },
    headers : {
      "accept": "application/json",
    },
    success: function (data) {
      hideSpinner();
      if(data.err) {
        console.log('Serverside Error');
        hideStockChart();
        showNoData();
      } else {
        if($.isEmptyObject(data.data)) {
          hideStockChart();
          showNoData();
        } else {
          showStockChart();
          hideNoData();
          updateShelf(data.data);
        }
      } 
    },
    error: function(data) {
      console.log("Error");
      console.log(data);
      hideStockChart();
      showNoData();
      hideSpinner ();
    }
  });
  return false;
}

function ini() {
  $("#endDate").val(getYesterday());
  $("#startDate").val(getYesterday());
  hideStockChart();
  showNoData();
  hideSpinner();
  fetchProducts();
}
$(document).ready(function() {
  ini();
  $("#date_range_button").click(function (event) {
    fetchData();
    fetchDetection();
  });
});

function set_detection_text_blank() {
  $('span.detection').html('')
}
function hideSpinner () {
  $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?'':$(".fa.fa-gear.fa-2x.fa-spin").addClass('hidden');
}
function showSpinner () {
  $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?$(".fa.fa-gear.fa-2x.fa-spin").removeClass('hidden'):'';
}

function showStockChart(params) {
  $(".stock_chart").hasClass('hidden')?$(".stock_chart").removeClass('hidden'):'';
  $(".thumbs").hasClass('hidden')?$(".thumbs").removeClass('hidden'):'';
}

function hideStockChart(params) {
  $(".stock_chart").hasClass('hidden')?'':$(".stock_chart").addClass('hidden');
  $(".thumbs").hasClass('hidden')?'':$(".thumbs").addClass('hidden');
}

function showNoData(params) {
  $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
}

function hideNoData(params) {
  $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
}
