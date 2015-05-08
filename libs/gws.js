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

var url = path.join(__dirname, '../wsdl/groupwise.wsdl');
var endpoint = 'http://localhost:7191/soap';
var client = {};
var sessionId = '';
var loggedIn = false;
var loggedInProxy = false;

var userinfo = {
	name: '',
	email: '',
	uuid: '',
	userid: '',
	domain: '',
	postOffice: '',
	fid: ''
};

var creds = {
	user: '',
	pass: '',
	prxy: ''
};

var Filter = require('./filter');

var ErrObj = function () {
	this.message = '';
	this.code = 0;
	this.params = {};
	this.subErr = {};

};

var GWS = function () {
	events.EventEmitter.call(this);
};

util.inherits(GWS, events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
function _getDateTimeStr(dt) {
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

function _login(args,cb){
	var e = new ErrObj();
	client.loginRequest(args, function (err, res) {
		if (err) {
			e.message = 'Failed To Login';
			e.subErr = err;
			e.params = params;
			cb(e, null);
		} else {
			if(res.status.code === 0) {
				sessionId = res.session;
				loggedIn = true;

				client.clearSoapHeaders();
				client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + sessionId + '</session>');

				userinfo = res.userinfo;

				cb(null, res);
			} else {
				e.message = 'Failed To Login To Server';
				e.subErr = res;
				e.code = res.status.code;
				cb(e,null);
			}

		}
	});
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

function _getTimezoneList(cb){
	var args = {};
	client.getTimezoneListRequest(args,function(err,res){
		if (err) {
			cb(err, null);
		} else {
			cb(null, res.folders.folder);
		}
	})
}

function _getSettings(cb) {
	var args = {};
	client._getSettingsRequest(args,function(err,res){
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

function _getItem(id, cb) {
	var args = {
		id: id
	};
	client._getSettingsRequest(args,function(err,res){
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	});
}

function _modifyItem(id, cb){
	/*
	 <modifyItemRequest>
	 <id type="types:uid"/>
	 <notification type="types:SharedFolderNotification"/> <updates type="types:ItemChanges"/> <recurrenceAllInstances type="unsignedInt"/>
	 </modifyItemRequest>
	 */

	var args = {
		id: id,
		updates: {
			update: {

			}
		}
	};

	client.modifyItemRequest(args,function(err,res){
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

GWS.prototype.getAddressBooks = function (cb) {
	var e = new ErrObj();

	_getAddressBookList(function(err,res){
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.subErr = err;
			cb(e, null);
		} else {
			cb(null,res);
		}
	});
};

GWS.prototype.getAddressBook = function (id, cb) {
	var e = new ErrObj();

	if(id.length > 0){
		cursor.retrieve(client,id,function(err,res){
			if(err){
				e.message = 'Failed To Get Address Book';
				e.subErr = err;
				cb(e, null);
			} else {
				cb(null,res);
			}
		});
	} else {
		e.message = 'No ID was passed in';
		cb(e, null);
	}
};

GWS.prototype.getGlobalAddressBook = function (cb) {
	var e = new ErrObj();

	_getAddressBookList(function(err,res){
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.subErr = err;
			cb(e, null);
		} else {
			var id = '';
			res.forEach(function(item){
				if(item.name === 'GroupWise Address Book'){
					id = item.id;
				}
			});
			if(id.length > 0){
				cursor.retrieve(client,id,function(err,res){
					if(err){
						e.message = 'Failed To Get Global Address Book';
						e.subErr = err;
						cb(e, null);
					} else {
						cb(null,res);
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
	var e = new ErrObj();

	_getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List';
			e.subErr = err;
			cb(e, null);
		} else {
			cb(null,res);
		}
	});
};

GWS.prototype.getCalendar = function (cb) {
	var e = new ErrObj();

	_getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List For Calendar Request';
			e.subErr = err;
			cb(e, null);
		} else {
			var id = '';
			res.forEach(function (item) {
				if (item.folderType === 'Calendar') {
					id = item.id;
				}
			});

			if(id.length > 0){
				var dt = _getDateTimeStr(new Date());
				var filter = new Filter();

				filter.element.op  = 'gt';
				filter.element.field = 'startDate';
				filter.element.value = dt;

				cursor.retrieve(client,id,function(err,res){
					if(err){
						e.message = 'Failed To Get Calendar Events';
						e.subErr = err;
						cb(e, null);
					} else {
						cb(null,res);
					}
				}, filter);
			} else {
				e.message = 'Failed To Find Calendar In Folders';
				cb(e, null);
			}
		}
	});
};

GWS.prototype.init = function (opts, cb) {
	var self = this;
	var e = new ErrObj();

	if (opts && opts.server) {
		endpoint = 'http://' + opts.server + '/soap';
	}
	if (opts && opts.wsdl) {
		url = opts.wsdl;
	}

	soap.createClient(url, function (err, c) {
		if (err) {
			e.message = 'Failed To Create SOAP Client';
			e.subErr = err;
			cb(e, null);
		} else {
			client = c;
			client.setEndpoint(endpoint);

			self.emit('init',{});

			cb(null, {
				message: 'Successfully Created Service Client'
			})
		}
	});
};

GWS.prototype.login = function (params, cb) {
	var self = this;
	var e = new ErrObj();

	if (params && params.user && params.pass) {
		var args = {
			auth:     {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'PlainText'
					}
				},
				username:   params.user,
				password:   params.pass
			},
			language: 'en',
			version:  '1.05',
			userid:   true
		};

		_login(args,function(err,res){
			if(err){
				self.emit('error', err);
				cb(err,null)
			} else {
				self.emit('login', res);
				cb(null,res);
			}
		});
	} else {
		e.message = 'Missing or Incorrect Parameters.';
		e.params = params;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.proxyLogin = function (params, cb) {
	var self = this;
	var e = new ErrObj();

	if (loggedIn && params && params.proxy) {
		var proxy = params.proxy + '.' + userinfo.postOffice + '.' + userinfo.domain;
		var args = {
			auth:     {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'Proxy'
					}
				},
				username:   params.user,
				password:   params.pass,
				proxy: proxy
			},
			userid:   true
		};

		_login(args,function(err,res){
			if(err){
				self.emit('error', err);
				cb(err,null)
			} else {
				self.emit('proxy', res);
				cb(null,res);
			}
		});
	} else {
		e.message = 'Missing or Incorrect Parameters.';
		e.params = params;
		self.emit('error', e);
		cb(e, null);
	}
};

GWS.prototype.logout = function (cb) {
	var self = this;
	var e = new ErrObj();

	if (loggedIn) {
		var args = {};
		client.logoutRequest(args, function (err, res) {
			if (err) {
				e.message = 'Failed To Logout';
				e.subErr = err;
				self.emit('error', e);
				cb(e, null);
			} else {
				sessionId = '';
				loggedIn = false;
				client.clearSoapHeaders();
				self.emit('logout', res);
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