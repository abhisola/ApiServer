var ctxRange = null;
var chartInstanceRange = null;
var ctxHourChartRange = null;
var chartHourRangeInstance = null;

// configure charts
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation = false;
var currData = new Array();

function updateDateRangeChart(json) {
    var labels = new Array();
    var data = new Array();
    var count = 0;
    var sum = 0;
    $.each(json.data, function (i, day) {
        var seconds = parseInt(day['time_recorded']);
        seconds = seconds > 120 ? 120 : seconds;
        var date = new Date(day['local_time']);
        //date.setTime(date.getTime() - date.getTimezoneOffset() * (60 * 1000) * 5);
        labels.push(day['local_time']);
        data.push(seconds);
        count++;
        sum += seconds;
    });
    var avg = Math.round(sum / count);
    if (avg < 0) avg = 0;
    $("#avgTime").html(avg);
    $("#counter").html(count);

    if (chartInstanceRange) chartInstanceRange.destroy();
    ctxRange = $("#dateRangeChart").get(0).getContext("2d");
    chartInstanceRange = new Chart(ctxRange, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                label: "Time Spent",
                backgroundColor: 'rgb(54, 162, 235)'
            }]
            // datasets: [ { data: data } ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        stepSize: 20
                    }
                }],
                xAxes: [{
                    stacked : true,
                    type: 'time',
                    distribution : 'series',
                       time : {
                           unit : 'hour',
                           round : 'hour',
                           displayFormats :{ 
                               quarter: 'MMMD h:mmA'
                           }
                       },
                       ticks: {
                           autoSkip : true
                       }
                }]
            }
        }
    });
    hideSpinner();
}

function updateHourlyRangeChart(json) {
    if (ctxHourChartRange) ctxHourChartRange.destroy();
    var hourlyList = [];
    var dayList = [];
    $.each(json.data, function (i, day) {
       var current = day['local_time'];
        var w = current.replace(' ', 'T');
        var dt = luxon.DateTime.fromISO(w);
        var day = {
            day : dt.day,
            hour : dt.hour
        }
        dayList.push(day);
    });
    var group = [];
    
    dayList.forEach(day => {   
        var newHour = day.hour > 12 ? day.hour - 12 : day.hour;
        newHour = newHour==0?12:newHour;
        var prefix = day.hour > 11 ? 'PM' : 'AM';
        var uniq = day.day + ", " + newHour + prefix;
        var found = _.find(group, { hour: uniq });
        if(found) found.count++;
        else group.push({ hour: uniq, count: 1 });
    });
    var labels = new Array();
    var data = new Array();
    group.forEach(day => {
        labels.push(day.hour);
        data.push(day.count);
    });
    ctxHourChartRange = $("#dateRangeHourlyChart").get(0).getContext("2d");
    ctxHourChartRange = new Chart(ctxHourChartRange, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                label: "Count",
                backgroundColor: 'rgb(54, 162, 235)'
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        stepSize: 10
                    }
                }],
                xAxes: []
            }
        }
    });
}

function getDateRangeURL() {
    return used_host + "/traffic/api/range/" + racknum;
}

function ini() {
    $("#endDate").val(getYesterday());
    $("#startDate").val(getYesterday());
}

function fetchDateRange() {
    showSpinner ();
    var date1 = $("#startDate").val();
    var date2 = $("#endDate").val();
    var utcDate1 = date1 + "T00:00:00"
    var utcDate2 = date2 + "T23:59:00"
    var range = {
        startDate: utcDate1,
        endDate: utcDate2
    }
    $.ajax({
        cache: false,
        type: 'POST',
        url: getDateRangeURL(),
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
            hideSpinner ();
            if (data.err) {
                console.log('Serverside Error');
                hideTrafficChart();
                showNoData();
            } 
            else {
                if(data.data.length > 0) {
                    showTrafficChart();
                    hideNoData();
                    updateDateRangeChart(data);
                    updateHourlyRangeChart(data);
                } else {
                    hideTrafficChart();
                    showNoData();
                }
                
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
            hideTrafficChart();
            showNoData();
            hideSpinner ();
        }
    });
    return false;
}
$(document).ready(function() {
    ini();
    hideTrafficChart();
    showNoData();
    hideSpinner ();

    $("#date_range_button").click(function (event) {
        fetchDateRange();
    });
});
function hideSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?'':$(".fa.fa-gear.fa-2x.fa-spin").addClass('hidden');
  }
  function showSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?$(".fa.fa-gear.fa-2x.fa-spin").removeClass('hidden'):'';
  }


function showTrafficChart(params) {
    $(".traffic_chart").hasClass('hidden')?$(".traffic_chart").removeClass('hidden'):'';
  }
  
  function hideTrafficChart(params) {
    $(".traffic_chart").hasClass('hidden')?'':$(".traffic_chart").addClass('hidden');
  }
  
  function showNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
  }
  
  function hideNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
  }
  