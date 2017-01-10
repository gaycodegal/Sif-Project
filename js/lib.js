
var jL = {
	objCons: ({}).constructor,
	aryCons: ([]).constructor,
	strCons: ("").constructor,
  text:function(text){
    return document.createTextNode(text);
  },
	div: function (className, id, innerHTML) {
		return jL.make("div", {
			className: className,
			id: id,
      innerHTML: innerHTML
		});
	},
  bind: function(element, eventname, handler, binder){
    binder = binder || element;
    element.addEventListener(eventname, (handler).bind(binder));
  },
	canvas: function (className, id, width, height) {
		return jL.make("canvas", {
			className: className,
			id: id,
      width: width,
      height: height
		});
	},
  subClass: function(sup,sub){
		sub.prototype = Object.create(sup.prototype);
		sub.prototype.constructor = sub;
	},
	append: function (element, parent) {
		if(!parent)
			parent = document.body;
		if (element)
			if (element.constructor != jL.aryCons) {
				if (element.constructor == jL.strCons)
					element = document.createTextNode(element);
				parent.appendChild(element);
			} else {
				for (var i = 0; i < element.length; i++) {
					jL.append(parent, element[i]);
				}
			}
	},
	divAdd: function (className) {
		var div = jL.div(className);
		for (var i = 1; i < arguments.length; i++)
			jL.append(arguments[i], div);
		return div;
	},
	make: function (tag, obj) {
		// without a valid tag we can't continue
		if (!tag) {
			console.error("Util.make failed with tag: " + tag);
			return;
		}
		var element = document.createElement(tag);
		for (var i in obj)
			if (obj[i])
				element[i] = obj[i];
		return element;
	},
};