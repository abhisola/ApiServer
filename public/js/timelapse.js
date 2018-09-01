
// configure charts
var myvid ;
var myvids = [];
var activeVideo = 0;

var video_dom_list = [];
var video_url_list = [];
var active_vidlist = [];

function getDateRangeURL() {
    return used_host + "/timelapse/api/" + racknum;
}

function hideSpinner() {
    $("i.fa-gear").addClass("hidden-xl-down");
}

function showSpinner() {
    $("i.fa-gear").removeClass("hidden-xl-down");
}

function ini() {
    $("#endDate").val(getYesterday());
    $("#startDate").val(getYesterday());
    $("#info").click(function () {
        $("#details").toggle(100);
    });
}

function playVideos(json){
    var videos = $('myvideos');
    var top = "<col-md-12>"
    var bottom = "</col-md-12>"
    var obj_keys = Object.keys(json)
    for (j = 0; j < obj_keys.length; j++) {
        var shelf = Object.keys(json)[j];
        var video = "<video src='', id='shelf" + shelf + "', width='100%', height='600' controls='', style='background:black'></video>"
        videos.html(top + video + bottom);
        var vid_dom = $('shelf' + shelf);
        vid_dom.bind('ended', function (e) {
            activeVideo = (++activeVideo) % myvids.length;
            // update the video source and play
            vid_dom.get(0).src = myvids[activeVideo];
            vid_dom.get(0).play();
        })
        video_dom_list.push(vid_dom);
        $.each(json[shelf], function (k, row) {
            if(shelf == 0) myvids.push(row['url'])
        })
    }
    console.log(myvids)
    if (myvid.length > 0) {
        myvid.get(0).src = myvids[activeVideo];
        myvid.get(0).play();
    } else {
        
    }
}
function fetchDateRange() {
    var date1 = $("#startDate").val();
    var date2 = $("#endDate").val();
    var range = {
        startDate: date1,
        endDate: date2
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
            if (data.err) console.log('Serverside Error');
            else {
                playVideos(data.data);
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    });
    return false;
}

$(document).ready(function () {
    ini();
    myvid = $('#myvideo');
    myvid.bind('ended', function(e) {
        console.log(e);
        activeVideo = (++activeVideo) % myvids.length;
      
        // update the video source and play
        myvid.get(0).src = myvids[activeVideo];
      
        myvid.get(0).play();
      });
  });