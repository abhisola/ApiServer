// configure charts
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation = false;
var currData = new Array();
var charts = [];

function customTooltips(tooltip) {
    var tooltipEl = document.getElementById('chartjs-tooltip');

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.innerHTML = "<img style='width:400px;height:auto;'></img><div>Hours :<span id='val'></span><span style='padding-left: 20px;' id='percent'></span><span style='padding-left: 20px;' id='shelf'></span><span style='padding-left: 20px;' id='date'></span></div>"
        document.body.appendChild(tooltipEl);
    } else {
        tooltipEl.querySelector('img').src = '';
        tooltipEl.querySelector('span#val').innerHTML = '';
        tooltipEl.querySelector('span#date').innerHTML = '';
        tooltipEl.querySelector('span#shelf').innerHTML = '';
        tooltipEl.querySelector('span#percent').innerHTML = '';
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
        var shelf = tooltipEl.querySelector('span#shelf');
        var percent = tooltipEl.querySelector('span#percent');
        var shelfNum = this._data.datasets[0].shelfs[tooltip.dataPoints[0].index];
        var percent_empty = this._data.datasets[0].percents[tooltip.dataPoints[0].index];
        val.innerHTML = tooltip.dataPoints[0].yLabel;
        date.innerHTML = "Date: "+tooltip.dataPoints[0].xLabel;
        shelf.innerHTML = "Shelf: " + (parseInt(shelfNum) + 1) + "";
        percent.innerHTML = "Percent: " + percent_empty;
    }
    var position = this._chart.canvas.getBoundingClientRect();
    var sTop = $(window).scrollTop();
    //console.log(sTop, 'sTop');
    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + tooltip.caretX + 'px';
    tooltipEl.style.top = sTop + tooltip.caretY + 'px';
    tooltipEl.style.fontFamily = tooltip._fontFamily;
    tooltipEl.style.fontSize = tooltip.fontSize;
    tooltipEl.style.fontStyle = tooltip._fontStyle;
    tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
}

function updateShelf(json) {
    for (m = 0; m < charts.length; m++) {
        if (charts[m]) {
            charts[m].destroy();
        }
    }
    charts = [];
    var keys = Object.keys(json);
    for (j = 0; j < keys.length; j++) {
        var rack = Object.keys(json)[j];
        var labels = new Array();
        var data = new Array();
        var images = new Array();
        var shelfs = new Array();
        var percents = new Array();
        $.each(json[rack], function (k, report) {
            labels.push(sanatizeTimeAndFormat(report['from_date']));
            data.push(parseFloat(report['hours']));
            images.push(report['from_url']);
            shelfs.push(report['shelf_num']);
            percents.push((100 - parseInt(report['from_percent'])) + '% To ' + (100 - parseInt(report['to_percent']))+'%');
        });

        var ctx_data = $("#chart" + rack).get(0).getContext("2d");
        var chart = new Chart(ctx_data, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: "#FF5335",
                    borderColor: "#FF5335",
                    images: images,
                    shelfs: shelfs,
                    percents: percents
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
                            min: 0,
                            stepSize: 2
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Hours To Restock'
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
    hideSpinner();
}

function getURL() {
    return used_host + "/shelves/api/restock/response/";
}

function hideSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?'':$(".fa.fa-gear.fa-2x.fa-spin").addClass('hidden');
  }
  function showSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?$(".fa.fa-gear.fa-2x.fa-spin").removeClass('hidden'):'';
  }
  
var response_data;
function fetchData() {
    showSpinner();
    $("canvas").empty();
    var start = $("#startDate").val() + "T00:01:00";
    var end = $("#endDate").val() + "T23:59:00";
    var hours = $("#hours").val();
    var percent = $("#percent").val();
    var arr = {
        startDate: start,
        endDate: end,
        hours: hours,
        percent: percent
    };
    $.ajax({
        cache: false,
        type: 'POST',
        url: getURL(),
        dataType: "json",
        data: JSON.stringify(arr),
        contentType: 'application/json',
        xhrFields: {
            // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
            // This can be used to set the 'withCredentials' property.
            // Set the value to 'true' if you'd like to pass cookies to the server.
            // If this is enabled, your server must respond with the header
            // 'Access-Control-Allow-Credentials: true'.
            withCredentials: false
        },
        headers: {
            "accept": "application/json",
        },
        success: function (data) {
            hideSpinner();
            console.log(JSON.stringify(data));
            if (data.err) {
                console.log('Serverside Error');
                hideResponseChart();
                showNoData();
            } else {
                showResponseChart();
                hideNoData();
                response_data = data.data;
                updateShelf(response_data);
            } 
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
            hideResponseChart();
            showNoData();
            hideSpinner();
        }
    });
    return false;
}
function refreshChart() {
    
    if(response_data) {
        $(".canvas").empty();
        updateShelf(response_data);
    }
    
}
function updateTextData(data) {
    var restock_data_dom = $('#restock_data.div > ul.list-group').empty();
    data.forEach(row => {
        
        var restock_text = (parseInt(row.shelf_num) + 1) + ": Restocked " + sanatizeTimeAndFormat2(row.to_date);
        var response_text = "Response Time: " + row.hours.toFixed(2) + " h"
        var list = '<li class="list-group-item"><div class="row"><div class="col-lg-6 col-md-6"><h2>Shelf '+ restock_text +'</h2></div>'+
        '<div class="col-lg-6 col-md-6"><h2>'+response_text+'</h2></div>'+
        '</div></div></li>';
        restock_data_dom.append(list);
    });
   }
function ini() {
    $("#endDate").val(getYesterday());
    $("#startDate").val(getYesterday());
    $("#date_range_button").click(function (event) {
        fetchData();
    });
    $(".nav-tabs").click(function (params) {
        refreshChart();
        setTimeout(refreshChart, 1500);
    });
}
$(document).ready(function () {
    ini();
    hideResponseChart();
    showNoData();
    hideSpinner();
});

function showResponseChart(params) {
    $(".response_chart").hasClass('hidden')?$(".response_chart").removeClass('hidden'):'';
  }
  
  function hideResponseChart(params) {
    $(".response_chart").hasClass('hidden')?'':$(".response_chart").addClass('hidden');
  }
  
  function showNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
  }
  
  function hideNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
  }
