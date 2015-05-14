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

function GetRndMinSec(val){
	if(val < 15) return 0;
	else if (val < 30) return 15;
	else if (val < 45) return 30;
	else return 45;
}

function BuildProxySessions() {
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
	var end = new Date();
	end.setDate(start.getDate() + 1);

	start.setHours(0);
	start.setMinutes(0);
	start.setSeconds(0);

	end.setHours(0);
	end.setMinutes(0);
	end.setSeconds(0);
	
	var params = {
		id: 'Conference Room 2',
		start: start,
		end: end
	};

	gws.getUserFreeBusy(params,function(err,res){
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
			BuildProxySessions();
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

	start.setMinutes(GetRndMinSec(start.getMinutes()));
	start.setSeconds(GetRndMinSec(start.getSeconds()));

	end.setHours(start.getHours() + 3);
	
	end.setMinutes(GetRndMinSec(end.getMinutes()));
	end.setSeconds(GetRndMinSec(end.getSeconds()));

	var params = {
		subject: 'A SOAP Created Meeting',
		message: 'This is a test meeting created by SOAP Client',
		start: start,
		end: end,
		allDay: false,
		place: 'Conference Room 2'
	};

	gws.createAppointment(params,function(err,res){
		if(err){
			console.error(err);
		} else {
			console.info(res.id[0]);
			var id = res.id[0];

			gws.getAppointment(id,function(err,res){
				if(err) console.error(err);
				else console.info(res.item);
			});

			setTimeout(function(){
				UpdateAppointment(id);
			},10000);

		}
	});
}

function UpdateAppointment(id){

	var start = new Date();
	var min = start.getMinutes();

	start.setHours(start.getHours() + 2);
	start.setMinutes(GetRndMinSec(start.getMinutes()));
	start.setSeconds(GetRndMinSec(start.getSeconds()));

	var params = {
		id: id,
		update: {
			startDate: start
		}
	};

	gws.updateAppointment(params,function(err,res){
		if(err){
			console.error(err);
		} else {
			console.info(res);
		}
	});
}

function GetSettings() {
	gws.getSettings(function(err,res){
		if(err) console.error(err);
		else {
			res.forEach(function(item){
				console.log(item);
			});
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

function Debug(){
	gws.debug(true);
}

function GetTimeZones(){
	gws.getTimeZones(function(err,res){
		if(err) console.error(err);
		else console.info(res);
	})
}

function GetCalendar(){
	gws.getCalendar(function(err,res){
		if(err){
			console.error(err);
		} else {
		}
	});
}

function GetRulesList(){
	gws.getRulesList(function(err,res){
		if(err) console.error(err);
		else console.info(res);
	});
}

function RunMeFirst() {

	gws.init(host, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			gws.login(creds, function (err, res) {
				if (err) {
					console.error(err);
				} else {
					console.info(res);
					//GetFreeBusy();
					//GetSettings();
					//GetRulesList();
					//GetProxyList();

					gws.initProxies(function(err,res){
						console.error('///////////////////////////////////////////////////////');
						if(err) console.error(err);
						else {
							res.forEach(function(item){
								console.info(item);
							});
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

RunMeFirst();