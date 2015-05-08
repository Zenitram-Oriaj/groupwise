/**
 * Created by Jairo Martinez on 5/8/15.
 */

var Filter = function () {
	this.element = {
		attributes: {
			type: "FilterEntry"
		},
		op:         '',
		field:      '',
		value:      ''
	}
};

module.exports = Filter;