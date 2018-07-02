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
    var json = _.groupBy(resjson.data, function (b) {
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
        var ctx_data = $("#chart" + shelf).get(0).getContext("2d");
        var chart = new Chart(ctx_data, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: "#A10054",
                    borderColor: "#A10054",
                }]
            },

            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            max: 24,
                            min: 0,
                            stepSize: 5
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Hours To Restock'
                        }
                    }],
                    xAxes: [
                        /*{
                                    type: 'time',
                                    unit: 'day',
                                    time: {
                                      displayFormats: {
                                        'day': 'MMM DD'
                                      }
                                    }
                                  }*/
                    ]
                }
            }
        });
        charts.push(chart);
    }
    $('img.thumb')
        .wrap('<span style="display:inline-block"></span>')
        .css('display', 'block')
        .parent()
        .zoom({
            magnify: '.2'
        });
    hideSpinner();
}

function getURL() {
    return used_host + "/shelves/api/restock/range/" + racknum;
}

function hideSpinner() {
    $("i.fa-gear").addClass("hidden-xl-down");
}

function showSpinner() {
    $("i.fa-gear").removeClass("hidden-xl-down");
}
function fetchData(event) {
    event.preventDefault();
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
            if (data.err) console.log('Serverside Error');
            else {
                updateRestockShelf(data);
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    });
    return false;
}

function ini() {
    $("#endDate").val(getYesterday());
    $("#startDate").val(getYesterday());
    $("#info").click(function () {
        $("#details").toggle(100);
    });
}
$(document).ready(function () {
    ini();
    $("#vsv").submit(fetchData);
});