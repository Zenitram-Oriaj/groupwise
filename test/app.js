/**
 * Created by Jairo Martinez on 5/7/15.
 */

var async = require('async');


var GWS = require('../libs/gws');
var gws = new GWS();

var proxies = [];
var resources = [];
var proxyList = [];

var host = {
	server: '172.16.76.2',            // Required
	port:   '7191',                   // Required
	wsdl:   '../wsdl/groupwise.wsdl'  // Optional
};

var creds = {
	user:    'ao',       // Required
	pass:    '!boi123',  // Required
	lang:    'en',       // Optional (Default: en)
	version: '1.05'   // Optional (Default: 1.05)
};

function collect() {

	// If you want to filter your results, then use the opts object.
	// Here I want to get events from 2 days ago and newer
	var dt = new Date();
	dt.setDate(dt.getDate() - 2);
	var dts = gws.getDateTimeStr(dt);

	var opts = {
		op:    'gt',                               // gt, lt, eq, contains,
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

function CollectProxiesByResources() {
	var ids = [];

	for(var i in resources){
		console.log(resources[i]);
		if(resources[i].owner == creds.user) ids.push(resources[i].name)
	}

	if(ids.length > 0){
		async.mapSeries(ids,ProxyLogin,function(err,results){
			if(err){
				console.error(err);
			} else {
				console.info(results);
				proxies = results;
				gws.setSession(proxies[1].session,function(err,res){
					if(err){

					} else {
						console.info(res);
						collect();
					}
				})
			}
		});
	}
}

function CollectProxiesByList() {
	var ids = [];

	for(var i in proxyList){
		ids.push(proxyList[i].displayName)
	}

	if(ids.length > 0){
		async.mapSeries(ids,ProxyLogin,function(err,results){
			if(err){
				console.error(err);
			} else {
				proxies = results;
				gws.setSession(proxies[1].session,function(err,res){
					if(err){
						console.error(err);
					} else {
						CreateAppointment();
					}
				});
			}
		});
	}
}

function CollectResources(){
	gws.getResources(function (err, res) {
		if (err) {
			console.error(err);
		} else {
			resources = res;
		}
	});
}

function ProxyLogin(id, cb) {

	var args = {
		proxy: id
	};

	gws.proxyLogin(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err,null);
		} else {
			cb(null, res);
		}
	});
}

function GetFreeBusy() {
	var start = new Date();
	var dt = new Date();
	dt.setDate(dt.getDate() + 3);
	var end = gws.getDateTimeStr(dt);

	gws.getUserFreeBusy('Conference Room 3',start,end,function(err,res){
		if(err){
			console.error(err);
		} else {
			console.info(res);
		}
	});
}

function GetProxyList(){
	gws.getProxyList(function(err,res) {
		if (err) {
			console.error(err);
		} else {
			proxyList = res;
			CollectProxiesByList();
		}
	});
}

function Logout(){
	gws.logout(function(err,res){

	});
}

function CreateAppointment(){
	var start = new Date();
	var end = new Date();

	var min = start.getMinutes();
	var val = 0;

	if(min < 15) val = 0;
	else if (min < 30) val = 15;
	else if (min < 45) val = 30;
	else val = 45;

	start.setMinutes(val);

	end.setHours(start.getHours() + 3);
	end.setMinutes(val);

	var params = {
		subject: 'A SOAP Created Meeting',
		message: 'This is a test meeting created by SOAP Client',
		start: start,
		end: end,
		allDay: false,
		place: 'Conference Room 1'
	};

	gws.createAppointment(params,function(err,res){
		if(err){
			console.error(err);
		} else {
			console.info(res.id[0]);
			RemoveAppointment(res.id[0]);
		}
	});
}

function RemoveAppointment(id){
	gws.removeAppointment(id,function(err,res){
		if(err){
			console.error(err);
		} else {
			console.info(res);
		}
	});
}

function GetCalendar(){
	gws.getCalendar(function(err,res){
		if(err){
			console.error(err);
		} else {
			Logout();
		}
	});
}

function run() {
	gws.init(host, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			gws.login(creds, function (err, res) {
				if (err) {
					console.error(err);
				} else {
					GetProxyList();
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