/**
 * Created by Jairo Martinez on 5/8/15.
 */
const ops = ['gt','lt','eq','gte','lte','contains'];


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

Filter.prototype.validate = function () {
	var op = false;

	if(this.element.op > 0){
		ops.forEach(function(o){
			if (this.element.op === o) op = true;
		});
	} else {
		return false
	}

	if(this.element.field.length <= 0) return false;
	if(this.element.field.value <= 0) return false;
	return true;
};

module.exports = Filter;