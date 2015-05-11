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
				console.info(results);
				proxies = results;
				gws.setSession(proxies[1].session,function(err,res){
					if(err){

					} else {
						console.info(res);
						collect();
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
			//console.info(res);
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

function run() {
	gws.init(host, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			gws.login(creds, function (err, res) {
				if (err) {
					console.error(err);
				} else {

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

					/*
					gws.getProxyList(function(err,res){
						if(err){
							console.error(err);
						}	else {
							proxyList = res;
							CollectProxiesByList();
						}
					});*/
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