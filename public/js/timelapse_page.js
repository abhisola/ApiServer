
// configure charts
var videos = {};
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
    $("#date_range_button").click(function (event) {
        fetchDateRange();
    });
    hideVideos();
    showNoData();
    hideSpinner ();
}

videos = {};

function inilialize(json){
    videos = {};
    console.log(json);
    var video_dom = $('#videos');
    var shelf_keys = Object.keys(json)
    for (j = 0; j < shelf_keys.length; j++) {
        var shelf_number = shelf_keys[j];
        var video_obj = {};
        video_obj.urls = json[shelf_number];
        video_obj.page = 0;
        video_obj.paged_urls = [];
        video_obj.shelf = shelf_number;
        
        videos[shelf_number] = video_obj;
    }
    
    render();
}

function render() {
    var video_dom = $('#videos');
    video_dom.html('');
    var shelf_keys = Object.keys(videos);
    console.log(video_dom);
    console.log(shelf_keys);
    for (j = 0; j < shelf_keys.length; j++) {
        var shelf_number = shelf_keys[j];
        var video_obj = videos[shelf_number];
        var from = track * video_obj.page;
        var vid1_src = video_obj.urls[from]?video_obj.urls[from].url:'';
        var vid2_src = video_obj.urls[from+1]?video_obj.urls[from+1].url:'';
        var vid3_src = video_obj.urls[from+2]?video_obj.urls[from+2].url:'';
        var day1 = video_obj.urls[from]?luxon.DateTime.fromISO(video_obj.urls[from].date_recorded).toFormat('dd LLL'):'';
        var day2 = video_obj.urls[from+1]?luxon.DateTime.fromISO(video_obj.urls[from+1].date_recorded).toFormat('dd LLL'):'';
        var day3 = video_obj.urls[from+2]?luxon.DateTime.fromISO(video_obj.urls[from+2].date_recorded).toFormat('dd LLL'):'';
        var video_top = "<div class='shelf_stock_row row'><div class='col-md-12 video-title' style='margin-bottom:20px;'><h2>Timelapse For Shelf " + (Number(video_obj.shelf)+1) + /*" - <span class='text-info'>Pringles Saur Cream And Onion </span>"+*/"</h2></div>";
        var back_button = "<div class='col-md-1'> <a  onclick='pagenator(" + video_obj.shelf + ", true)'><img src='/img/back.jpg' ></a> </div>";
        var video_1 = "<div class='col-md-3 video-container'> <video src='"+vid1_src+"', id='1_shelf" + video_obj.shelf + "', controls='', style='background:black' width='250'></video><label class='video-container-label'>"+day1+"</label> </div> ";
        var video_2 = "<div class='col-md-3 video-container'> <video src='"+vid2_src+"', id='2_shelf" + video_obj.shelf + "', controls='', style='background:black' width='250'></video><label class='video-container-label'>"+day2+"</label> </div> ";
        var video_3 = "<div class='col-md-3 video-container'> <video src='"+vid3_src+"', id='3_shelf" + video_obj.shelf + "', controls='', style='background:black' width='250'></video><label class='video-container-label'>"+day3+"</label> </div> ";
        var next_button = "<div class='col-md-1'> <a onclick='pagenator(" + video_obj.shelf + ", false)'><img src='/img/next.jpg'></a> </div>";
        var video_bottom = "</div>";
        console.log(video_top + back_button + video_1 + video_2 + video_3 + next_button + video_bottom);
        video_dom.append(video_top + back_button + video_1 + video_2 + video_3 + next_button + video_bottom);
    }
}

function pagenator(shelf_number, back) {
    var shelf = videos[shelf_number];
    var total_pages = Math.ceil(shelf.urls.length/3) - 1; 
    if(back) 
        shelf.page == 0 ? 0 : shelf.page--;
    else 
        shelf.page >= total_pages ? total_pages : shelf.page++;
        
        render();
}
function fetchDateRange() {
    showSpinner ();
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
            hideSpinner ();
            if (data.err) { 
                console.log('Serverside Error');
                hideVideos();
                showNoData();
            }
            else {
                if($.isEmptyObject(data.data)) {
                    hideVideos();
                    showNoData();
                } else {
                    hideNoData();
                    showVideos();
                    inilialize(data.data);
                }
                
                
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
            hideVideos();
            showNoData();
            hideSpinner ();
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

  function hideSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?'':$(".fa.fa-gear.fa-2x.fa-spin").addClass('hidden');
  }
  function showSpinner () {
    $(".fa.fa-gear.fa-2x.fa-spin").hasClass('hidden')?$(".fa.fa-gear.fa-2x.fa-spin").removeClass('hidden'):'';
  }

  function showVideos(params) {
    $("#videos").hasClass('hidden')?$("#videos").removeClass('hidden'):'';
  }
  
  function hideVideos(params) {
    $("#videos").hasClass('hidden')?'':$("#videos").addClass('hidden');
  }
  
  function showNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?$(".shelves_chart_nodata").removeClass('hidden'):'';
  }
  
  function hideNoData(params) {
    $(".shelves_chart_nodata").hasClass('hidden')?'':$(".shelves_chart_nodata").addClass('hidden');
  }