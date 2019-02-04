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

		 function getTodayURL() {
		     return used_host + "/traffic/api/today/" + racknum;
		 }

		 function getDateRangeURL() {
		     return used_host + "/traffic/api/range/" + racknum;
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

		 function resetData() {
		     showSpinner();
		     $.ajax({
		         cache: false,
		         type: 'DELETE',
		         url: getTodayURL(),
		         dataType: "json",
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
		             else fetchTodayData(data);
		             hideSpinner();
		         },
		         error: function (data) {
		             console.log("Error");
		             console.log(data);
		             hideSpinner();
		         }
		     });
		     return false;
		 }

		 function fetchDateRange() {
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
		             if (data.err) console.log('Serverside Error');
		             else {
		                 updateDateRangeChart(data);
		                 updateHourlyRangeChart(data);
		             }
		         },
		         error: function (data) {
		             console.log("Error");
		             console.log(data);
		         }
		     });
		     return false;
		 }
		 function sanatizeTimeAndFormat(isoDateString) {
		     var san = isoDateString.replace(' ','T');
		     var dt = luxon.DateTime.fromISO(san).toFormat('LLL dd, T');
		     return dt;
		 }

		 ini();