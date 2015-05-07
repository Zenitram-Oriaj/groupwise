/**
 * Created by Jairo Martinez on 5/7/15.
 */

var client = {};

var CreateCursor = function (id, cb) {
	var args = {
		container: id
	};

	client.createCursorRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null)
		} else {
			cb(null, res);
		}
	});
};

/*

 args = args || {
	 container: id,
		 filter:    {
			 element: {
				 attributes: {
				  type: "FilterEntry"
			 },
		 field:      'modified',
		 value:      new Date(),
		 date:       'Today'
		 }
	 }
 };

 */

function ReadCursor(id, csr, cnt, cb) {
	var args = {
		container: id,
		cursor:    csr,
		forward:   false,
		position:  'end',
		count:     cnt
	};

	client.readCursorRequest(args, function (err, res) {
		if (err) {
			cb(err, null)
		} else {
			cb(null, res.items.item);
		}
	});
}

function DeleteCursor(id, csr, cb) {
	var args = {
		container: id,
		cursor:    csr
	};
	client.destroyCursorRequest(args, function (err, res) {
		if (err) {
			cb(err, null)
		} else {
			cb(null, res);
		}
	});
}

module.exports.retrieve = function (c, id, cb, params) {
	var csr = 0;
	var dat = {};
	var cnt = 5;
	client = c;

	if(params){

	}

	CreateCursor(id, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			csr = res.cursor;
			ReadCursor(id, csr, cnt, function (err, res) {
				if (err) {
					cb(err, null);
				} else {
					dat = res;
					DeleteCursor(id, csr, function (err) {
						if (err) {
							cb(err, null);
						} else {
							cb(null, dat);
						}
					});
				}
			})
		}
	});
};