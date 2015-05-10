/**
 * Created by Jairo Martinez on 5/7/15.
 */

var GWS = require('../libs/gws');
var gws = new GWS();

function collect(){

	// If you want to filter your results, then use the opts object.
	// Here I want to get events from 2 days ago and newer
	var dt = new Date();
	dt.setDate(dt.getDate() - 2);
	var dts = gws.getDateTimeStr(dt);

	var opts = {
		op: 'gt',                               // gt, lt, eq, contains,
		field: 'startDate',
		value: dts
	};

	gws.getCalendar(opts, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('////////////////   GET CALENDAR   ///////////////');
			console.info(res);
		}
	});
}

function run() {
	var args = {
		server: '172.16.76.2',            // Required
		port:   '7191',                   // Required
		wsdl:   '../wsdl/groupwise.wsdl'  // Optional
	};

	gws.init(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.info(res);
			var args = {
				user: 'ao',       // Required
				pass: '!boi123',  // Required
				lang: 'en',       // Optional (Default: en)
				version: '1.05'   // Optional (Default: 1.05)
			};

			gws.login(args, function (err, res) {
				if (err) {
					console.error(err);
				} else {
					console.info(res);

					var args = {
						proxy: 'Conference Room 1'
					};

					gws.proxyLogin(args, function (err, res) {
						if (err) {
							console.error(err);
						} else {
							console.info(res);
							collect();
						}
					});
				}
			});
		}
	})
}

gws.on('response', function (res) {

});

gws.on('error', function (e) {
	console.error('Got An Error At ' + new Date());
});

run();