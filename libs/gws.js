/**
 * Created by Jairo Martinez on 5/7/15.
 */

/**
 * Created by Jairo Martinez on 5/7/15.
 */
var soap = require('soap');
var path = require('path');

var async = require('async');
var _ = require('underscore');

var events = require('events');
var util = require('util');

var cursor = require('./cursor');
var error = require('./error');

var client = {};
var url = path.join(__dirname, '../wsdl/groupwise.wsdl');
var port = 7191;
var endpoint = 'http://localhost:7191/soap';

var Filter = require('./filter');
var Proxy = require('./proxy');
var User = require('./user');

var user = new User();
var debug = false;

var GWS = function () {
	events.EventEmitter.call(this);
};

util.inherits(GWS, events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

function _afterLogin(obj,cb){
	_getFolderList(function(err,res){
		if(err){
			cb(err,obj);
		} else {
			obj.folders = _parseResponse(res);
			cb(null,obj);
		}
	});
}

function _checkSetParams(params, type) {
	if (params) {

		// Optional Params
		if (params.lang) user.creds.lang = params.lang;
		if (params.version
			&& params.version == '1.05'
			|| params.version == '1.04'
			|| params.version == '1.03'
			|| params.version == '1.02'
		) user.creds.version = params.version;

		// Required Params

		switch (type) {
			case 1:{
				if (params.user) user.creds.user = params.user;
				else return false;

				if (params.pass) user.creds.pass = params.pass;
				else return false;

				return true;
			}
			case 2:{
				if (params.proxy) user.creds.proxy = params.proxy + '.' + user.info.postOffice + '.' + user.info.domain;
				else return false;

				return true;
			}
			default: break;
		}
	} else {
		return false;
	}
}

function _checkStatusCode(res){
	var code = res.status.code;
	return (code == 0);
}

function _clearUser(){
	user = new User();
}

function _createItem(args, cb){
	args = args || {};
	client.createItemRequest(args, function(err,res){
		cb(err,res);
	});
}

function _cursor(id,cb){
	cursor.retrieve(client, id, function (err, res) {
		cb(err,res);
	});
}

function _init(cb){
	soap.createClient(url, function (err, c) {
		if (err) {
			cb(err, null);
		} else {
			client = c;
			client.setEndpoint(endpoint);

			client.on('request',function(xml){
				if(debug) console.info(xml);
			});
			cb(null,client);
		}
	});
}

function _initProxies(cb){
	var list = [];

	_getProxyList(function(err,res){
		if(err) cb(err,null);
		else {
			res = _parseResponse(res);

			for(var i in res){
				list.push(res[i].displayName)
			}

			if(list.length > 0){
				async.mapSeries(list,_loginProxy,function(err,proxies){
					if(err){
						cb(err,null);
					} else {
						cb(null,proxies);
					}
				});
			}
		}
	});
}

function _getDateTimeStr(dt){

	if (dt instanceof Date) {
	} else {
		dt = new Date(dt);
	}

	var yy = dt.getFullYear();
	var mm = dt.getMonth() + 1;
	var dd = dt.getDate();

	var hh = dt.getHours();
	var nn = dt.getMinutes();

	if (dd < 10) dd = '0' + dd;
	if (mm < 10) mm = '0' + mm;
	if (hh < 10) hh = '0' + hh;
	if (nn < 10) nn = '0' + nn;

	return yy + '-' + mm + '-' + dd + 'T' + hh + ':' + nn + ':00.000Z';
}

function _getSettings(args, cb){
	args = args || {};
	client.getSettingsRequest(args, function(err,res){
		cb(err,res);
	});
}

function _getContainer(folders, type){
	var id = '';
	folders.forEach(function(folder){
		if(folder.name === type){
			id = folder.id;
		}
	});

	return id;
}

function _getProxy(session){
	var obj = {};
	if(user.proxies.length > 0){
		obj = _.findWhere(user.proxies,{session: session});
	}
	return obj;
}

function _getSession(){
	var headers = client.getSoapHeaders();

	var str = headers[0];
	var a = str.indexOf('>');

	if(a > -1){
		str = str.slice((a + 1),str.length);
		a = str.indexOf('<');
		if(a > -1){
			str = str.slice(0,a);
		}
	}
	return str;
}

function _getId(res,ref){
	var id = '';
	res.forEach(function (item) {
		if (item.folderType == ref) {
			id = item.id;
		}
	});

	return id;
}

function _getAppointments(items){
	var events = [];
	items.forEach(function(item){
		if(item.attributes['xsi:type'] === 'gwt:Appointment') events.push(item);
	});

	return events;
}

function _getProxyList(cb){
	var args = {};
	client.getProxyListRequest(args,function(err,res){
		cb(err,res);
	})
}

function _getAddressBookList(cb) {
	var args = {};
	client.getAddressBookListRequest(args, function (err, res) {
		cb(err, res);
	});
}

function _getFolderList(cb) {
	var args = {
		parent:  'folders',
		recurse: true,
		imap:    false,
		nntp:    false
	};
	client.getFolderListRequest(args, function (err, res) {
		cb(err, res);
	});
}

function _getRuleList(cb) {
	var args = {};
	client.getRuleListRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	});
}

function _setSession(id){
	client.clearSoapHeaders();

	if(id){
		client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + id + '</session>');
	}
}

function _startFreeBusySession(args,cb){
	client.startFreeBusySessionRequest(args,function(err,res){
		cb(err,res);
	});
}

function _getFreeBusySession(id,cb){
	var args = {
		freeBusySessionId: id
	};

	client.getFreeBusyRequest(args,function(err,res){
		cb(err,res);
	});
}

function _closeFreeBusySession(id,cb){
	var args = {
		freeBusySessionId: id
	};

	client.closeFreeBusySessionRequest(args,function(err,res){
		cb(err,res);
	});
}

function _getTimezoneList(cb) {
	var args = {};
	client.getTimezoneListRequest(args, function (err, res) {
		cb(err,res);
	})
}

function _getItem(args, cb) {
	client.getItemRequest(args, function (err, res) {
		cb(err,res);
	});
}

function _getItems(id,filter, cb) {
	var args = {
		id: id,
		filter: filter
	};
	client.getItemsRequest(args, function (err, res) {
		cb(err, res);
	});
}

function _login(args, cb) {
	client.loginRequest(args, function (err, res) {
		cb(err,res);
	});
}

function _loginProxy(id, cb) {
	var proxy = new Proxy();
	var pid = id + '.' + user.info.postOffice + '.' + user.info.domain;
	var args = {
		auth:   {
			attributes: {
				'xsi_type': {
					xmlns: 'types',
					type:  'Proxy'
				}
			},
			username:   user.creds.user,
			password:   user.creds.pass,
			proxy:      pid
		},
		userid: true
	};

	client.loginRequest(args, function (err, res) {
		if(err) cb(err,null);
		else {
			proxy.uid = pid;
			proxy.session = res.session;
			proxy.info = res.userinfo;
			proxy.entry = res.entry;

			_afterLogin(proxy, function (err) {
				user.proxies.push(proxy);
				cb(err, proxy);
			});
		}
	});
}

function _logout(cb){
	var args = {};
	client.logoutRequest(args, function (err, res) {
		cb(err,res);
	});
}

function _modifyItem(args, cb) {
	client.modifyItemRequest(args, function (err, res) {
		cb(err,res);
	})
}

function _parseResponse(res){
	if(res.folders) return res.folders.folder;
	if(res.blocks) return res.blocks.block;
	if(res.items) return res.items.item;
	if(res.timezones) return res.timezones.timezone;
	if(res.books) return  res.books.book;
	if(res.settings) return res.settings.group;
	if(res.rules) return res.rules.rule;
	if(res.proxies) return res.proxies.proxy;

	else return res;
}

function _parseStatus(res){
	var e = new error.obj();

	console.error(res);
	return e;
}

function _removeItem(args,cb){
	args = args || {};

	client.removeItemRequest(args, function (err, res) {
		cb(err,res);
	})
}

function _sendItem(args,cb){
	client.sendItemRequest(args,function(err,res){
		cb(err,res);
	})
}

function _setFilter(opts){
	var filter = new Filter();

	filter.element.op = opts.op;
	filter.element.field = opts.field;
	filter.element.value = opts.value;
	if(opts.date) filter.element.date = opts.date;

	return filter;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

GWS.prototype.removeAppointment = function(id,cb){
	var e = new error.obj();
	var obj = {};
	var ses = _getSession();

	if (ses == user.session){
		obj = user;
	} else {
		obj = _getProxy(ses);
	}

	var args = {
		container: _getContainer(obj.folders,'Calendar'),
		id: id
	};

	_removeItem(args,function(err,res){
		if(err){
			cb(err,null);
		} else {
			if(_checkStatusCode(res)){
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.updateAppointment = function(params,cb){
	var e = new error.obj();
	var obj = {};

	var args = {
		id: params.id,
		updates: {}
	};

	if(params.update){
		if(params.update.startDate && params.update.startDate instanceof Date) {
			params.update.startDate = params.update.startDate.toISOString();
		}
		if(params.update.endDate && params.update.endDate instanceof Date) {
			params.update.endDate = params.update.endDate.toISOString();
		}

		args.updates.update = params.update;
	}
	if(params.add){
		args.updates.add = params.add;
	}
	if(params.delete){
		args.updates.delete = params.delete;
	}

	console.log(args);

	_modifyItem(args,function(err,res){
		if(err){
			e.message = '';
			e.code = -1;
			e.subErr = err;
			e.params = params;
			cb(e,null);
		} else {
			if(_checkStatusCode(res)){
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.createAppointment = function(params,cb){
	var e = new error.obj();
	var obj = {};
	var ses = _getSession();

	if (ses == user.session){
		obj = user;
	} else {
		obj = _getProxy(ses);
	}

	var args = {
		item: {
			attributes:{
				type: 'Appointment'
			},
			class: 'Public',
			container: _getContainer(obj.folders,'Calendar'),
			acceptLevel: 'Busy',
			startDate: params.start.toISOString(),
			endDate: params.end.toISOString(),
			subject: params.subject || '',
			message: params.message,
			allDayEvent: params.allDay || false,
			place: params.place || user.info.name
		}
	};

	console.log(args);

	_createItem(args,function(err,res){
		if(err){
			e.message = 'Fail To Create Appointment';
			e.subErr = err;
			cb(e,res);
		} else {
			if(_checkStatusCode(res)){
				res = _parseResponse(res);
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getAppointment = function(id,cb){
	var e = new error.obj();
	var args = {
		id: id,
		view: 'default'
	};

	_getItem(args,function(err,res){
		if(err){
			e.message = 'Error Occurred';
			e.code = -1;
			e.subErr = err;
			cb(e,null);
		} else {
			if(_checkStatusCode(res)){
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getRulesList = function(cb){
	var e = new error.obj();

	_getRuleList(function(err,res){
		if(err){
			e.message = '';
			e.code = -1;
			e.subErr = err;
			cb(err,null);
		} else {
			if(_checkStatusCode(res)){
				res = _parseResponse(res);
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	})
};

GWS.prototype.getTimeZones = function(cb){
	var e = new error.obj();
	_getTimezoneList(function(err,res){
		if (err){
			e.message = '';
			e.code = -1;
			e.subErr = err;
			cb(e,null);
		} else {
			if(_checkStatusCode(res)){
				res = _parseResponse(res);
				cb(null,res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getUserFreeBusy = function(params,cb){
	var e = new error.obj();

	var args = {
		users:[{
			user: {
				displayName: params.id
			}
		}],
		startDate: _getDateTimeStr(params.start),
		endDate: _getDateTimeStr(params.end)
	};

	console.info(args);

	_startFreeBusySession(args,function(err,res){
		if(err){
				cb(err,null);
			} else {
			if(_checkStatusCode(res)){
				var id = res.freeBusySessionId;
				_getFreeBusySession(id,function(err,res){
						if(err){
							cb(err,null);
						} else {
							var result = res;
							_closeFreeBusySession(id,function(err,res){
								var items = [];
								if(result.freeBusyInfo && result.freeBusyInfo.user){
									result.freeBusyInfo.user.forEach(function(item){
										item = _parseResponse(item);
										item.forEach(function(b){
											items.push(b);
										});
									});
									cb(err,items);
								} else {
									cb(err,result);
								}


							});
						}
					});
			} else {
					e.message = 'Error Occurred :: ' + res.status.description;
					e.code = res.status.code;
					e.subErr = res.status.problems.entry;
					e.params = user;
					cb(e,null);
				}
		}
	});
};

GWS.prototype.getProxyList = function(cb){
	var e = new error.obj();

	if(user.loggedIn){
		_getProxyList(function(err,res){
			if(err){
				cb(err,null);
			} else {
				if(_checkStatusCode(res)){
					res = _parseResponse(res);
					cb(null,res);
				} else {
					e = _parseStatus(res);
					cb(e,null);
				}
			}
		});
	} else {
		e.message = 'Not Logged In';
		e.code = -1;
		cb(e,null);
	}
};

GWS.prototype.getAddressBooks = function (cb) {
	var e = new error.obj();

	_getAddressBookList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.code = -1;
			e.subErr = err;
			cb(e, null);
		} else {
			if(_checkStatusCode(res)){
				res = _parseResponse(res);
				cb(null, res);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getAddressBook = function (id, cb) {
	var e = new error.obj();

	if (id.length > 0) {
		cursor.retrieve(client, id, function (err, res) {
			if (err) {
				e.message = 'Failed To Get Address Book';
				e.subErr = err;
				cb(e, null);
			} else {
				if(_checkStatusCode(res)){
					cb(null, res);
				} else {
					e = _parseStatus(res);
					cb(e,null);
				}
			}
		});
	} else {
		e.message = 'No ID was passed in';
		e.code = -1;
		cb(e, null);
	}
};

GWS.prototype.getGlobalAddressBook = function (cb) {
	var e = new error.obj();

	_getAddressBookList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.code = -1;
			e.subErr = err;
			cb(e, null);
		} else {
			if(_checkStatusCode(res)){
				var id = '';
				res.forEach(function (item) {
					if (item.name === 'GroupWise Address Book') id = item.id;
				});
				if (id.length > 0) {
					_cursor(id, function (err,res) {
						if(err){
							cb(err,null);
						} else {
							if(_checkStatusCode(res)){
								cb(null,res);
							} else {
								e = _parseStatus(res);
								cb(e,null);
							}
						}
					});
				} else {
					e.message = 'Failed To Find Global Address Book In Address List';
					e.code = -1;
					cb(e, null);
				}
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getSettings = function(cb){
	var e = new error.obj();
	_getSettings({},function(err,res){
		if(err){
			e.message = '';
			e.code = -1;
			e.subErr = err;
			cb(e,null);
		} else {
			if(_checkStatusCode(res)){
				res = _parseResponse(res);
				var items = [];
				res.forEach(function(item){
					var t = {};
					t.name = item.attributes.type;
					t.setting = item.setting;
					items.push(t);
				});

				cb(null,items);
			} else {
				e = _parseStatus(res);
				cb(e,null);
			}
		}
	});
};

GWS.prototype.getResources = function(cb){
	var e = new error.obj();

	_getAddressBookList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.subErr = err;
			cb(e, null);
		} else {
			if(_checkStatusCode(res)){
				var id = '';
				res = _parseResponse(res);

				res.forEach(function (item) {
					if (item.name === 'GroupWise Address Book') {
						id = item.id;
					}
				});
				if (id.length > 0) {
					cursor.retrieve(client, id, function (err, res) {
						if (err) {
							e.message = 'Failed To Get Global Address Book';
							e.subErr = err;
							cb(e, null);
						} else {
							var resources = [];
							res.forEach(function(u){
								if(u.attributes['xsi:type'] == 'gwt:Resource'){
									resources.push(u);
								}
							});

							cb(null,resources);
						}
					});
				} else {
					e.message = 'Failed To Find Global Address Book In Address List';
					cb(e, null);
				}
			}

		}
	});
};

GWS.prototype.getCalendar = function (opts, cb) {
	var e = new error.obj();

	if (typeof opts === 'function') { cb = opts; opts = null;}

	_getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List For Calendar Request';
			e.code = -1;
			e.subErr = err;
			cb(e, null);
		} else {
			res = _parseResponse(res);
			var id = _getId(res,'Calendar');
			if (id.length > 0) {
				if(opts) {
					var filter = _setFilter(opts);

					_getItems(id, filter, function(err,res){
						if (err) {
							e.message = 'Failed To Get Calendar Events';
							e.subErr = err;
							cb(e, null);
						} else {
							if(_checkStatusCode(res)){
								var items = _getAppointments(res);
								cb(null, items);
							} else {
								e = _parseStatus(res);
								cb(e,null);
							}
						}
					});
				} else {
					cursor.retrieve(client, id, function (err, res) {
						if (err) {
							e.message = 'Failed To Get Calendar Events';
							e.subErr = err;
							cb(e, null);
						} else {
							cb(null, res);
						}
					});
				}
			} else {
				e.message = 'Failed To Find "Calendar" Item In Folders';
				e.code = 0;
				cb(e, null);
			}
		}
	});
};

GWS.prototype.init = function (opts, cb) {
	var e = new error.obj();

	if(opts){
		if (opts.wsdl) url = opts.wsdl;
		if (opts.port) port = opts.port;
		if (opts.server) endpoint = 'http://' + opts.server + ':' + port.toString() +  '/soap';
		_init(function(err,res){
			if(err){
				e.message = 'Failed To Create SOAP Client';
				e.code = -1;
				e.subErr = err;
				e.params = opts;
				cb(e,null);
			} else {
				cb(null,res);
			}
		});
	} else {
		e.message = 'Missing options object';
		e.code = -1;
		e.params = {
			server: '',
			port:   7191,
			wsdl:   ''
		};
		cb(e, null);
	}
};

GWS.prototype.initProxies = function (cb) {
	var e = new error.obj();

	if(user.loggedIn){
		_initProxies(function(err,res){
			if(err){
				e.message = '';
				e.code = -1;
				cb(e,null);
			} else {
				cb(null,res)
			}
		});
	} else {
		e.message = 'You need to be logged in a primary user first';
		e.code = -1;
		cb(e,null);
	}
};

GWS.prototype.login = function (params, cb) {
	var self = this;
	var e = new error.obj();

	if (_checkSetParams(params, 1)) {
		var args = {
			auth:     {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'PlainText'
					}
				},
				username:   user.creds.user,
				password:   user.creds.pass
			},
			language: user.creds.lang,
			version:  user.creds.version,
			userid:   true
		};

		_login(args, function (err, res) {
			if (err) {
				cb(err, null)
			} else {
				if(_checkStatusCode(res)){
					user.loggedIn = true;
					user.info = res.userinfo;
					user.session = res.session;
					var dat = {
						session: res.session,
						info: res.userinfo,
						version: res.gwVersion,
						build: res.build,
						serverUtcTime: res.serverUTCTime
					};

					_setSession(user.session);
					_afterLogin(user, function(err,res){
						dat.folders = res.folders;
						cb(err, dat);
					});
				} else {
					e = _parseStatus(res);
					cb(e,null);
				}
			}
		});
	} else {
		e.message = error.getParamError(params);
		e.params = params;
		e.code = -1;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.proxyLogin = function (param, cb) {
	var self = this;
	var e = new error.obj();
	var proxy = new Proxy();

	var opts = {
		proxy: param
	};

	if (user.loggedIn && _checkSetParams(opts, 2)) {
		var args = {
			auth:   {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'Proxy'
					}
				},
				username:   user.creds.user,
				password:   user.creds.pass,
				proxy:      user.creds.proxy
			},
			userid: true
		};

		_login(args, function (err, res) {
			if (err) {
				e.message = 'Failed To Login';
				e.subErr = err;
				e.params = args;
				cb(e, null);
			} else {
				if (_checkStatusCode(res)) {
					proxy.uid = user.creds.proxy;
					proxy.session = res.session;
					proxy.info = res.userinfo;
					proxy.entry = res.entry;

					_afterLogin(proxy, function(err,res){
						user.proxies.push((proxy));
						cb(err, proxy);
					});
				} else {
					e = _parseStatus(res);
					e.args = params;
					cb(e, null);
				}
			}
		});
	} else {
		e.message = 'Missing or Incorrect Parameters.';
		e.params = params;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.setSession = function (id,cb) {
	var e = new error.obj();

	if(id){
		_setSession(id);
		cb(null,{msg: 'ok'});
	} else {
		e.message = 'No ID specified';
		e.code = -1;
		cb(e,null);
	}
};

GWS.prototype.logout = function (cb) {
	var self = this;
	var e = new error.obj();

	if (user.loggedIn) {
		_setSession(user.session);
		_logout(function(err,res){
			if (err) {
				e.message = 'Failed To Logout';
				e.subErr = err;
				self.emit('error', e);
				cb(e, null);
			} else {
				if(_checkStatusCode(res)){
					_clearUser();
					client.clearSoapHeaders();
					cb(null, res);
				} else {
					e = _parseStatus(res);
					cb(e,null);
				}
			}
		});
	} else {
		e.message = 'Not Logged In To Server';
		e.code = -1;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.debug = function(bool){
	debug = bool;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

module.exports = GWS;