
// configure charts
var video_list = {};
var pager = {};
var track = 3;
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

function inilialize(json){

    video_list = {};
    var videos = $('#videos');
    var obj_keys = Object.keys(json)
    for (j = 0; j < obj_keys.length; j++) {
        var shelf = Object.keys(json)[j];
        video_list.urls = json[shelf];d
        video_list.page = 0;
        video_list.paged_url = [];
        video_list.shelf = shelf;
        var video_top = "<div class='row'><div class='col-md-12 video-title' style='margin-bottom:20px;'><h2>Timelapse For Shelf "+(Number(shelf)+1)+"</h2></div>"
        var back_button =  "<div class='col-md-1'> <a  onclick='pagenator("+shelf+", true)'><img src='/images/back.jpg' ></a> </div>"
        var video_1 = "<div class='col-md-3 video-container'> <video src='', id='1_shelf" + shelf + "', controls='', style='background:black'></video> </div> "
        var video_2 = "<div class='col-md-3 video-container'> <video src='', id='2_shelf" + shelf + "', controls='', style='background:black'></video> </div> "
        var video_3 = "<div class='col-md-3 video-container'> <video src='', id='3_shelf" + shelf + "', controls='', style='background:black'></video> </div> "
        var next_button =  "<div class='col-md-1'> <a onclick='pagenator("+shelf+", false)'><img src='/images/next.jpg'></a> </div>"
        var video_bottom = "</div>"
        videos.append(video_top + back_button + video_1 + video_2 + video_3 + next_button + video_bottom);
        /*var vid_dom = $('shelf' + shelf);
        vid_dom.bind('ended', function (e) {
            activeVideo = (++activeVideo) % myvids.length;
            // update the video source and play
            vid_dom.get(0).src = myvids[activeVideo];
            vid_dom.get(0).play();
        })
        video_dom_list.push(vid_dom);
        $.each(json[shelf], function (k, row) {
            if(shelf == 0) myvids.push(row['url'])
        })*/
    }
    console.log(video_list);
    console.log(video_list.urls);
}
function pagenator(key, back) {
    var shelf = video_list[key];
    video_list[key].paged_urls = [];
    var current_page = shelf.page;
    var from = track * current_page;
    if(back) shelf.page -= current_page;
    else shelf.page += current_page;
    console.log("Shelf: ");
    console.log(shelf);
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
                inilialize(data.data);
                console.log(data);
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