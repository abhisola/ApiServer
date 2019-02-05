var racknum = $("#rackNum").val();
var api = {
    local: {
        host: 'http://localhost:3001',
    },
    online: {
        host: 'https://smartrackapi.herokuapp.com',
    }
}

var used_host = api.online.host;

function getToday() {
    var today = new Date();

    var year = today.getFullYear();

    var month = today.getMonth() + 1;
    month = (month < 10 ? "0" : '') + month;

    var day = today.getDate();
    day = (day < 10 ? "0" : '') + day;

    return year + "-" + month + "-" + day;
}
function getYesterday() {
    var today = new Date();
    var mius_days = luxon.DateTime.fromISO(today.toISOString()).minus({
        days: 1
    });
    var year = mius_days.year;

    var month = mius_days.month;
    month = (month < 10 ? "0" : '') + month;

    var day = mius_days.day;
    day = (day < 10 ? "0" : '') + day;

    return year + "-" + month + "-" + day;
}

function sanatizeTimeAndFormat(isoDateString) {
    var san = isoDateString.substr(0, isoDateString.lastIndexOf('.'));
    var dt = luxon.DateTime.fromISO(san).toFormat('LLLdd, hh:mma');
    return dt;
}
function sanatizeTimeAndFormat2(isoDateString) {
    var san = isoDateString.substr(0, isoDateString.lastIndexOf('.'));
    var dt = luxon.DateTime.fromISO(san).toFormat('LLL dd, hh:mma');
    return dt;
}
$(document).ready(function() {
    $("#details").toggle(100);
    $("#info").click(function() { $("#details").toggle(100); });
    $('[data-toggle="tooltip"]').tooltip();
});
