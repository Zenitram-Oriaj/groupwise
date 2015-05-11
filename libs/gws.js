/**
 * Created by Jairo Martinez on 5/7/15.
 */

/**
 * Created by Jairo Martinez on 5/7/15.
 */
var soap = require('soap');
var path = require('path');
var events = require('events');
var util = require('util');

var cursor = require('./cursor');
var error = require('./error');

var url = path.join(__dirname, '../wsdl/groupwise.wsdl');
var endpoint = 'http://localhost:7191/soap';
var client = {};
var sessionId = '';
var loggedIn = false;

var userinfo = {
	name:       '',
	email:      '',
	uuid:       '',
	userid:     '',
	domain:     '',
	postOffice: '',
	fid:        ''
};

var creds = {
	user:    '',
	pass:    '',
	proxy:   '',
	lang:    'en',
	version: '1.05'
};

var Filter = require('./filter');
var Proxy = require('./proxy');

var GWS = function () {
	events.EventEmitter.call(this);
};

util.inherits(GWS, events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

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

	return yy + '-' + mm + '-' + dd + 'T' + hh + ':' + nn + ':00.000';
}

function _checkStatusCode(code){
	return (code == 0);
}

function _clearUser(){
	userinfo = {};
}

function _setSession(id){
	client.clearSoapHeaders();

	if(id){
		client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + id + '</session>');
	}
}

function _setFilter(opts){
	var filter = new Filter();

	filter.element.op = opts.op;
	filter.element.field = opts.field;
	filter.element.value = opts.value;
	if(opts.date) filter.element.date = opts.date;

	return filter;
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

function _checkSetParams(params, type) {
	if (params) {

		// Optional Params
		if (params.lang) creds.lang = params.lang;
		if (params.version
			&& params.version == '1.05'
			|| params.version == '1.04'
			|| params.version == '1.03'
			|| params.version == '1.02'
		) creds.version = params.version;

		// Required Params

		switch (type) {
			case 1:{
				if (params.user) creds.user = params.user;
				else return false;

				if (params.pass) creds.pass = params.pass;
				else return false;

				return true;
			}
			case 2:{
				if (params.proxy) creds.proxy = params.proxy + '.' + userinfo.postOffice + '.' + userinfo.domain;
				else return false;

				return true;
			}
			default: break;
		}
	} else {
		return false;
	}
}

function _getAppointments(items){
	var events = [];
	items.forEach(function(item){
		console.log(item.attributes['xsi:type']);
		if(item.attributes['xsi:type'] === 'gwt:Appointment') events.push(item);
	});

	return events;
}

function _login(args, cb) {
	client.loginRequest(args, function (err, res) {
		cb(err,res);
	});
}

function _logout(cb){
	var args = {};
	client.logoutRequest(args, function (err, res) {
		cb(err,res);
	});
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
		if (err) {
			cb(err, null);
		} else {
			cb(null, res.books.book);
		}
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
		if (err) {
			cb(err, null);
		} else {
			cb(null, res.folders.folder);
		}
	});
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
		if (err) {
			cb(err, null);
		} else {
			cb(null, res.folders.folder);
		}
	})
}

function _getSettings(cb) {
	var args = {};
	client._getSettingsRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

function _getItem(id, cb) {
	var args = {
		id: id,
		view: 'default peek'
	};
	client.getItemRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	});
}

function _getItems(id,filter, cb) {
	var args = {
		id: id,
		filter: filter
	};
	client.getItemsRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			if(res.items){
				cb(null, res.items.item);
			} else {
				cb(null, res);
			}

		}
	});
}

function _modifyItem(id, cb) {
	/*
	 <modifyItemRequest>
	 <id type="types:uid"/>
	 <notification type="types:SharedFolderNotification"/> <updates type="types:ItemChanges"/> <recurrenceAllInstances type="unsignedInt"/>
	 </modifyItemRequest>
	 */

	var args = {
		id:      id,
		updates: {
			update: {}
		}
	};

	client.modifyItemRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

GWS.prototype.getDateTimeStr = function(dt) {
		return _getDateTimeStr(dt);
};

GWS.prototype.getUserFreeBusy = function(user,start,end,cb){
	var e = new error.obj();

	var dts = _getDateTimeStr(start);
	var dtn = _getDateTimeStr(end);

	if(user){
		var args = {
			users:[{
					user: {
						displayName: user
					}
				}
			],
			startDate: dts,
			endDate: dtn
		};

		_startFreeBusySession(args,function(err,res){
			if(err){
				cb(err,null);
			} else {
				if(_checkStatusCode(res.status.code)){
					var id = res.freeBusySessionId;
					_getFreeBusySession(id,function(err,res){
						if(err){
							cb(err,null);
						} else {
							var result = res;
							_closeFreeBusySession(id,function(err,res){
								var items = [];
								result.freeBusyInfo.user.forEach(function(item){
									item.blocks.block.forEach(function(b){
										items.push(b);
									});
								});
								cb(err,items);
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
	} else {

	}
};

GWS.prototype.getProxyList = function(cb){
	var e = new error.obj();

	if(loggedIn){
		_getProxyList(function(err,res){
			if(res.proxies){
				cb(null,res.proxies.proxy)
			} else {
				cb(err,res);
			}
		});
	} else {
		e.message = 'Not Logged In';
		cb(e,null);
	}
};

GWS.prototype.getAddressBooks = function (cb) {
	var e = new error.obj();

	_getAddressBookList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.subErr = err;
			cb(e, null);
		} else {
			cb(null, res);
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
				cb(null, res);
			}
		});
	} else {
		e.message = 'No ID was passed in';
		cb(e, null);
	}
};

GWS.prototype.getGlobalAddressBook = function (cb) {
	var e = new error.obj();

	_getAddressBookList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.subErr = err;
			cb(e, null);
		} else {
			var id = '';
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
						cb(null, res);
					}
				});
			} else {
				e.message = 'Failed To Find Global Address Book In Address List';
				cb(e, null);
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
			var id = '';
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
	});
};

GWS.prototype.getFolders = function (cb) {
	var e = new error.obj();

	_getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List';
			e.subErr = err;
			cb(e, null);
		} else {
			cb(null, res);
		}
	});
};

GWS.prototype.getCalendar = function (opts, cb) {
	var e = new error.obj();

	if (typeof opts === 'function') {
		cb = opts;
		opts = null;
	}

	_getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List For Calendar Request';
			e.code = -1;
			e.subErr = err;
			cb(e, null);
		} else {
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
							var items = _getAppointments(res);
							cb(null, items);
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
	var self = this;
	var e = new error.obj();

	if (opts && opts.wsdl) {
		url = opts.wsdl;
	}

	if (opts && opts.server) {
		endpoint = 'http://' + opts.server + ':' + opts.port.toString() +  '/soap';
	}

	soap.createClient(url, function (err, c) {
		if (err) {
			e.message = 'Failed To Create SOAP Client';
			e.subErr = err;
			cb(e, null);
		} else {
			client = c;
			client.setEndpoint(endpoint);
			cb(null, {
				message: 'Successfully Created Service Client'
			})
		}
	});
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
				username:   creds.user,
				password:   creds.pass
			},
			language: creds.lang,
			version:  creds.version,
			userid:   true
		};

		_login(args, function (err, res) {
			if (err) {
				self.emit('error', err);
				cb(err, null)
			} else {
				loggedIn = true;
				userinfo = res.userinfo;
				sessionId = res.session;
				_setSession(sessionId);

				self.emit('response', res);
				cb(null, res);
			}
		});
	} else {
		e.message = error.getParamError(params);
		e.params = params;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.proxyLogin = function (params, cb) {
	var self = this;
	var e = new error.obj();
	var proxy = new Proxy();

	if (loggedIn && _checkSetParams(params, 2)) {
		var args = {
			auth:   {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'Proxy'
					}
				},
				username:   creds.user,
				password:   creds.pass,
				proxy:      creds.proxy
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
				if (res.status.code === 0) {
					proxy.uid = creds.proxy;
					proxy.session = res.session;
					proxy.userinfo = res.userinfo;
					proxy.entry = res.entry;

					_setSession(proxy.session);
					cb(null, proxy);
				} else {
					e.message = 'Failed To Login To Server';
					e.subErr = res;
					e.code = res.status.code;
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
		cb(e,null);
	}
};

GWS.prototype.logout = function (cb) {
	var self = this;
	var e = new error.obj();

	if (loggedIn) {
		_setSession(sessionId);

		_logout(function(err,res){
			if (err) {
				e.message = 'Failed To Logout';
				e.subErr = err;
				self.emit('error', e);
				cb(e, null);
			} else {
				sessionId = '';
				loggedIn = false;
				_clearUser();

				client.clearSoapHeaders();
				self.emit('response', res);
				cb(null, res);
			}
		});
	} else {
		e.message = 'Not Logged In To Server';
		self.emit('error', e);
		cb(e, null);
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

module.exports = GWS;