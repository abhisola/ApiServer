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
    // function getBody(bodyItem) {
    //   return bodyItem.lines;
    // }
    // Set Text
    if (tooltip.body) {
        var tableRoot = tooltipEl.querySelector('img');
        var val = tooltipEl.querySelector('span#val');
        var date = tooltipEl.querySelector('span#date');
        var shelf = tooltipEl.querySelector('span#shelf');
        var percent = tooltipEl.querySelector('span#percent');
        var ttImg = this._data.datasets[0].images[tooltip.dataPoints[0].index];
        var shelfNum = this._data.datasets[0].shelfs[tooltip.dataPoints[0].index];
        var percent_empty = this._data.datasets[0].percents[tooltip.dataPoints[0].index];
        val.innerHTML = tooltip.dataPoints[0].yLabel;
        date.innerHTML = "Date: "+tooltip.dataPoints[0].xLabel;
        shelf.innerHTML = "Shelf: " + (parseInt(shelfNum) + 1) + "";
        percent.innerHTML = "Percent: " + percent_empty;
        if(ttImg == null || ttImg == 'null') {
            tableRoot.src = "#";
        } else tableRoot.src = ttImg;
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
/* Thumb Images Generation
        // now build a div from images arr
        // count total number images
        imagesTotal = images.length;
        // determine width of div to write to
        thumbsDivWidth = $("#shelf" + shelf).width();
        // calculate the number of images to fit in that div
        thumbsNum = Math.floor(thumbsDivWidth / 150);
        // create (or clear out if it already exists) thumbs div
        if ($("#thumbs" + shelf).length) {
            $("#thumbs" + shelf).empty();
        } else {
            $("#shelf" + shelf + " .col-md-12").after("<div id='thumbs" + shelf + "' class='thumbs col-md-12 nolpadding norpadding'></div>");
        }
        // create a new array with that number of images
        thumbs = new Array();
        thumbsDates = new Array();
        // if there aren't enough thumbs to fill the div, just write what we have
        if (imagesTotal < thumbsNum) {
            skipNum = 0;
            thumbsNum = imagesTotal;
            for (i = 0; i < imagesTotal + 1; i++) {
                thumbs.push(images[i]);
                thumbsDates.push(labels[i]);
            }
        } else {
            skipNum = Math.floor(imagesTotal / (thumbsNum - 1));
            // if the div exists, empty it
            for (i = 0; i < imagesTotal + 1; i = i + skipNum) {
                if (imagesTotal - i < skipNum) {
                    thumbs.push(images[imagesTotal - 1]);
                    thumbsDates.push(labels[imagesTotal - 1]);
                } else {
                    thumbs.push(images[i]);
                    thumbsDates.push(labels[i]);
                }
            }
        }
        // make thumbnail mouseover work
        // write image thumbnails to div in correct width
        for (i = 0; i < thumbsNum; i++) {
            $("#thumbs" + shelf).append("<span class='thumb-wrap'><a href='" + thumbs[i] + "'><img class='thumb' src=" + thumbs[i] + " width='148' title='" + thumbs[i] + "'></a></span>");
        }
*/
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
    /*$('img.thumb')
        .wrap('<span style="display:inline-block"></span>')
        .css('display', 'block')
        .parent()
        .zoom({
            magnify: '.2'
        });*/
    hideSpinner();
}

function getURL() {
    return used_host + "/shelves/api/restock/response/";
}

function hideSpinner() {
    $("i.fa-gear").addClass("hidden-xl-down");
}

function showSpinner() {
    $("i.fa-gear").removeClass("hidden-xl-down");
}

function fetchData(event) {
    event.preventDefault();
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
            console.log(JSON.stringify(data));
            if (data.err) console.log('Serverside Error');
            else updateShelf(data.data);
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
