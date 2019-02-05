var ctxRange = null;
var chartInstanceRange = null;
var ctxHourChartRange = null;
var chartHourRangeInstance = null;

// configure charts
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation = false;
var currData = new Array();
var charts = [];
function updateRestockShelf(resjson) {
    for (m = 0; m < charts.length; m++) {
        if (charts[m]) {
            charts[m].destroy();
        }
    }
    charts = [];
    var json = _.groupBy(resjson, function (b) {
        return b.shelf_num;
    })
    console.log(json);
    var keys = Object.keys(json);
    for (j = 0; j < keys.length; j++) {
        var shelf = Object.keys(json)[j];
        var labels = new Array();
        var data = new Array();
        $.each(json[shelf], function (k, report) {
            labels.push(sanatizeTimeAndFormat(report['to_date']));
            data.push(parseFloat(report['hours']).toFixed(2));
        });
        var canva = $("#chart" + shelf);
        var ctx_data = canva.get(0).getContext("2d");
        var chart = new Chart(ctx_data, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: "#A10054",
                    borderColor: "#A10054",
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [],
                    xAxes: [{
                        ticks: {
                            max: 24,
                            min: 0,
                            stepSize: 5
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Hours To Restock'
                        }
                    }]
                }
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
        });
        charts.push(chart);
    }
    hideSpinner();
}

function getURL() {
    return used_host + "/shelves/api/restock/range/" + racknum;
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
    var date1 = $("#startDate").val();
    var date2 = $("#endDate").val();
    var utcDate1 = date1 + "T00:01:00"
    var utcDate2 = date2 + "T23:59:00"
    var range = {
        startDate: utcDate1,
        endDate: utcDate2
    }
    $.ajax({
        cache: false,
        type: 'POST',
        url: getURL(),
        dataType: "json",
        data: JSON.stringify(range),
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
            if (data.err) {
                hideRestockChart();
                showNoData();
                console.log('Serverside Error');
            } else {
                if(data.data.length > 0) {
                    response_data = data.data;
                    updateRestockShelf(response_data);
                    updateTextData(response_data);
                    showRestockChart();
                    hideNoData();
                } else {
                    hideRestockChart();
                    showNoData();
                }
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
            hideRestockChart();
            showNoData();
            hideSpinner();
        }
    });
    return false;
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
    hideRestockChart();
    showNoData();
    hideSpinner();
}
function refreshChart() {
    if(response_data) {
        $(".canvas").empty();
        updateRestockShelf(response_data);
    }
    
}
$(document).ready(function () {
    ini();
    $("#date_range_button").click(function (event) {
        fetchData();
    });
    $(".nav-tabs").click(function (params) {
        refreshChart();
        setTimeout(refreshChart, 1500);
    });
});

function showRestockChart(params) {
    $(".restock_chart").hasClass('hidden')?$(".restock_chart").removeClass('hidden'):'';
  }
  
  function hideRestockChart(params) {
    $(".restock_chart").hasClass('hidden')?'':$(".restock_chart").addClass('hidden');
  }
  
  function showNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
  }
  
  function hideNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
  }