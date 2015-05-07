/**
 * Created by Jairo Martinez on 5/7/15.
 */

var GWS = require('../libs/gws');
var gws = new GWS();

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
		pass: '!boi23'
	};

	gws.login(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('//////////////////////////////////////////////////////');
			console.info(res);
		}
	});
});

gws.on('login', function () {

	gws.GetFolders(function(err,res){
		if (err) {
			console.error(err);
		} else {
			console.error('//////////////////////////////////////////////////////');
			console.info(res);
		}
	});

	gws.GetGlobalAddressBook(function(err,res){
		if (err) {
			console.error(err);
		} else {
			console.error('//////////////////////////////////////////////////////');
			console.info(res);
		}
	});

	gws.GetCalendar(function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('//////////////////////////////////////////////////////');
			console.info(res);
		}
	});
});

run();