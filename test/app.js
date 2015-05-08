/**
 * Created by Jairo Martinez on 5/7/15.
 */

var GWS = require('../libs/gws');
var gws = new GWS();

function collect(){
	gws.getCalendar(function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('////////////////   GET CALENDAR   ///////////////');
			console.info(res);
		}
	});
}

function run() {
	var opts = {
		server: '172.16.76.2:7191'
	};

	gws.init(opts, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.info(res);
		}
	})
}

gws.on('init', function () {
	var args = {
		user: 'ao',
		pass: '!boi123'
	};

	gws.login(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('///////////////////   LOGIN   ///////////////////');
			console.info(res);
		}
	});
});

gws.on('login', function () {
	var args = {
		user: 'ao',
		pass: '!boi123',
		proxy: 'Conference Room 1'
	};

	gws.proxyLogin(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('///////////////////   PROXY   ///////////////////');
			console.info(res);
		}
	});
});

gws.on('proxy', function () {
	collect();
});

gws.on('error', function (e) {

});

run();