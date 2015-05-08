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

var ErrObj = function () {
	this.message = '';
	this.params = {};
	this.err = {};
};

var GWS = function () {
	events.EventEmitter.call(this);
};

util.inherits(GWS, events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

GWS.prototype.getAddressBooks = function (cb) {
	var e = new ErrObj();

	_getAddressBookList(function(err,res){
		if (err) {
			e.message = 'Failed To Get Address Book List';
			e.err = err;
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
				e.err = err;
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
			e.err = err;
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
						e.err = err;
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
			e.err = err;
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
			e.err = err;
			cb(e, null);
		} else {
			var id = '';
			res.forEach(function (item) {
				if (item.folderType === 'Calendar') {
					id = item.id;
				}
			});

			if(id.length > 0){
				cursor.retrieve(client,id,function(err,res){
					if(err){
						e.message = 'Failed To Get Calendar Events';
						e.err = err;
						cb(e, null);
					} else {
						cb(null,res);
					}
				});
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
			e.err = err;
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

		client.loginRequest(args, function (err, res) {
			if (err) {
				e.message = 'Failed To Login';
				e.err = err;
				e.params = params;
				cb(e, null);
			} else {
				if(res.status.code === 0) {
					sessionId = res.session;
					loggedIn = true;
					client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + sessionId + '</session>');
					self.emit('login', res);
					cb(null, res.userid);
				} else {
					e.message = 'Failed To Login To Server';
					e.err = res;
					cb(e,null);
				}

			}
		});
	} else {
		e.message = 'Missing or Incorrect Parameters.';
		e.params = params;
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
				e.err = err;
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