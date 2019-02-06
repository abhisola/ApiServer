
var shelf_config = {
    "s1" : {
        "min" : 20,
        "max": 60
    },
    "s2" : {
        "min" : 60,
        "max" : 120
    },
    "s3" : {
        "min" : 120,
        "max" : 220
    },
    "s4" : {
        "min" : 220,
        "max": 320
    },
    "s5" : {
        "min" : 320,
        "max" : 420
    }
};
var cans = {};

function getURL() {
    return used_host + "/tof_sensor_demo/api/" + racknum;
}
function getURLConfig(shelf) {
    return used_host + "/tof_sensor_demo/api/config/" + racknum + '/'+ shelf;
}
var response_data;
function fetchData() {
    showSpinner ();
    var date1 = $("#selectedDate").val();
    var utcDate1 = date1 + "T00:00:00"
    var date2 = $("#selectedDate").val();
    var utcDate2 = date2 + "T23:59:00"
    var range = {
        startDate: utcDate1,
        endDate: utcDate2
    }
    $.ajax({
        cache: false,
        type: 'PUT',
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
            hideSpinner ();
            if (data.err) {
                console.log('Serverside Error');
                hidePringlesChart();
                showNoData();
            } else {
                if(data.data.length > 0) {
                    response_data = data.data;
                    updateData(response_data);
                    showPringlesChart();
                    hideNoData();
                } else {
                    hidePringlesChart();
                    showNoData();
                }
            }
        },
        error: function (data) {
            hideSpinner ();
            console.log("Error");
            console.log(data);
        }
    });
    return false;
}
function fetchConfig(shelf) {
    $.ajax({
        cache: false,
        type: 'GET',
        url: getURLConfig(shelf),
        xhrFields: {
            // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
            // This can be used to set the 'withCredentials' property.
            // Set the value to 'true' if you'd like to pass cookies to the server.
            // If this is enabled, your server must respond with the header
            // 'Access-Control-Allow-Credentials: true'.
            withCredentials: false
        },
        success: function (json) {
            if (json.err) {
                console.log('Serverside Error While Fetching Config');
            } else {
                if($.isEmptyObject(json.data)) {
                    console.log("No Config Found Usind Default Config");
                } else {
                    shelf_config = json.data.data;
                    console.log("Using Server Config");
                    
                }
            }
        },
        error: function (json) {
            console.log("Error");
            console.log(json);
        }
    });
    return false;
}

function updateData(data) {
    console.log(data);
    var shelf_data = data[0].data;
    cans.s1 = countCans(shelf_data,1);
    cans.s2 = countCans(shelf_data,2);
    cans.s3 = countCans(shelf_data,3);
    cans.s4 = countCans(shelf_data,4);
    cans.s5 = countCans(shelf_data,5);
    render();
}

function render() {
    var rows = 5;
    var row = '<tr>'+
    '<td>'+getCans(cans.s1)+'</td>'+
    '<td>'+getCans(cans.s2)+'</td>'+
    '<td>'+getCans(cans.s3)+'</td>'+
    '<td>'+getCans(cans.s4)+'</td>'+
    '<td>'+getCans(cans.s5)+'</td>'+
    '</tr>';
    console.log(row);
    $('#data').html(row);
}
function getCans(cans) {
    var can_string = "";
    for (let i = 1; i <= cans; i++) {
        can_string += '<div class="flavor-original circle"></div>'
    }
    return can_string;
}
function countCans(data, row) {
    console.log(data);
    var obj = data.s1;
    if(row == 1) obj = data.s1;
    else if (row == 2) obj = data.s2;
    else if (row == 3) obj = data.s3;
    else if (row == 4) obj = data.s4;
    else if (row == 5) obj = data.s5;

    if(obj>= 0 && obj < shelf_config.s1.max) {
        return 5;
    } else if(obj > shelf_config.s2.min && obj < shelf_config.s2.max) {
        return 4;
    } else if(obj > shelf_config.s3.min && obj < shelf_config.s3.max) {
        return 3;
    } else if(obj > shelf_config.s4.min && obj < shelf_config.s4.max) {
        return 2;
    } else if(obj > shelf_config.s5.min && obj < shelf_config.s5.max) {
        return 1;
    } else if(obj > 1000 || obj == -1) {
        return 0;
    }
}

function ini() {
    $("#selectedDate").val(getToday());
    hidePringlesChart();
    showNoData();
    hideSpinner ();
}
function refreshData() {
    fetchData();
    
}
$(document).ready(function () {
    ini();
    $("#date_range_button").click(function (event) {
        fetchConfig(1);
        fetchData();
    });
    setInterval(refreshData, 20000);
});

function hideSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?'':$(".fa.fa-gear.fa-2x.fa-spin").addClass('hidden');
  }
  function showSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?$(".fa.fa-gear.fa-2x.fa-spin").removeClass('hidden'):'';
  }

function showPringlesChart(params) {
    $(".pringles_chart").hasClass('hidden')?$(".pringles_chart").removeClass('hidden'):'';
  }
  
  function hidePringlesChart(params) {
    $(".pringles_chart").hasClass('hidden')?'':$(".pringles_chart").addClass('hidden');
  }
  
  function showNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
  }
  
  function hideNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
  }