function Time(seconds, frames) {
  var s = seconds || 0;
  var f = frames || 0;
  this.fps = Time.fps;
  Object.defineProperties(this, {
    frames: {
      get: function () {
        return f;
      },
      set: function (x) {
        f = x;
        if (f > this.fps || f < 0) {
          h = Math.floor(f / this.fps);
          s += h;
          f -= h * this.fps;
        }
      }
    },
    seconds: {
      get: function () {
        return s;
      },
      set: function (x) {
        s = x;
      }
    }
  });
  this.frames = f;
};

Time.prototype.add = function (time) {
  this.frames += time.frames;
  this.seconds += time.seconds;
};

Time.prototype.absolute = function () {
  return this.frames / this.fps + this.seconds;
};

Time.prototype.toString = function () {
  var str = "";
  var addS = false;
  if (this.seconds > 0) {
    if (addS) {
      str += " ";
    }
    str += this.seconds + "s";
    addS = true;
  }
  if (this.frames > 0) {
    if (addS) {
      str += " ";
    }
    str += this.frames + "f";
    addS = true;
  }
  if (!addS) {
    str += "0f";
  }
  return str;
};

Time.parse = function (timestring) {
  var things = timestring.split(" ");
  var frames = 0;
  var seconds = 0;
  for (var i = 0; i < things.length; i++) {
    var hms = things[i].substring(things[i].length - 1);
    var amt = parseFloat(things[i]);
    if (hms == "f") {
      frames += amt;
    } else if (hms == "s") {
      seconds += amt;
    } else if (hms == "m") {
      seconds += amt * 60;
    } else if (hms == "h") {
      seconds += amt * 3600;
    } else {
      throw new Error("Time ABRT");
    }
  }
  return new Time(seconds, frames);
};
Time.fps = 24;


function SIFElement(attrs) {
  this.attrs = attrs || {};
  this.children = [];
  this.parent = this;
}

SIFElement.prototype.openXML = function (tabs, tab, keyAttrs) {
  var str = tabs + "<" + this.tag;
  str += this.toXMLAttrs(tabs, tab, keyAttrs);
  str += ">\n";
  return str;
};

SIFElement.prototype.closeXML = function (tabs, tab) {
  return tabs + "</" + this.tag + ">\n";
};

SIFElement.prototype.toXMLSelfClosing = function (tabs, tab) {
  return tabs + "<" + this.tag + this.toXMLAttrs(tabs, tab) + "/>";
};

SIFElement.prototype.toXMLAttrs = function (tabs, tab, keys) {
  var str = "";
  for (var key in this.attrs) {
    str += " " + key + '="' + this.attrs[key] + '"';
  }
  if (keys) {
    for (var i = 0; i < keys.length; i++) {
      var pair = this.toUnderscorePair(keys[i]);
      str += " " + pair[1] + '="' + this[pair[0]] + '"';
    }
  }
  return str;
};

SIFElement.prototype.toUnderscorePair = function (pair) {
  var a = (pair.constructor == jL.aryCons) ? pair[0] : pair;
  var b;
  if (pair.constructor == jL.strCons) {
    b = pair;
    if (b.toLowerCase() != b) {
      b = b.replace(/[A-Z]/g, function (r) {
        return "_" + r.toLowerCase();
      });
    }
  } else {
    b = pair[1];
  }
  return [a, b];
};

SIFElement.prototype.addChild = function (child) {
  this.children.push(child);
};

function TextElement(text) {
  this.text = text;
}

TextElement.prototype.toXML = function (tabs, tab) {
  return tabs + this.text;
};

function GeneralElement(attrs) {
  SIFElement.call(this, attrs);
  this.selfClosing = false;
  this.keyAttrs = [];
}

jL.subClass(SIFElement, GeneralElement);

GeneralElement.prototype.toXML = function (tabs, tab) {
  var str = ""
  if (!this.selfClosing) {
    str += this.openXML(tabs, tab, this.keyAttrs);
    for (var i = 0; i < this.children.length; i++) {
      str += this.children[i].toXML(tabs + tab, tab);
    }
    str += this.closeXML(tabs, tab);
  } else {
    str += "<" + this.tag + this.toXMLAttrs(tabs, tab, this.keyAttrs) + "/>";
  }
  return str;
};

function Canvas(origin, scale, attrs) {
  GeneralElement.call(this, attrs);
  this.origin = origin;
  this.scale = scale;
  this.layers = [];
  this.metas = [];
  this.keyframes = [];
}

jL.subClass(GeneralElement, Canvas);

Canvas.prototype.toXML = function (tabs, tab) {
  var str = ""
  if (!this.selfClosing) {
    str += this.openXML(tabs, tab, this.keyAttrs);
    for (var i = 0; i < this.children.length; i++) {
      str += this.children[i].toXML(tabs + tab, tab);
    }
    for (var i = 0; i < this.metas.length; i++) {
      str += this.metas[i].toXML(tabs + tab, tab);
    }
    for (var i = 0; i < this.keyframes.length; i++) {
      str += this.keyframes[i].toXML(tabs + tab, tab);
    }
    for (var i = 0; i < this.layers.length; i++) {
      str += this.layers[i].toXML(tabs + tab, tab);
    }
    str += this.closeXML(tabs, tab);
  } else {
    str += "<" + this.tag + this.toXMLAttrs(tabs, tab, this.keyAttrs) + "/>";
  }
  return str;
};


function DocumentElement(attrs) {
  SIFElement.call(this, attrs);
}

jL.subClass(SIFElement, DocumentElement);

DocumentElement.prototype.toXML = function (tabs, tab) {
  var str = "";
  for (var i = 0; i < this.children.length; i++) {
    str += this.children[i].toXML(tabs, tab);
  }
  return str;
};

function VectorSuper(attrs) {
  SIFElement.call(this, attrs);
}

jL.subClass(SIFElement, VectorSuper);

VectorSuper.prototype.toXML = function (tabs, tab) {
  var str = this.openXML(tabs, tab);
  for (var i = 0; i < this.keys.length; i++) {
    var key = this.keys[i];
    str += tabs + tab + "<" + key + ">" + this[key] + "</" + key + ">\n";
  }
  str += this.closeXML(tabs, tab);
  return str;
};

VectorSuper.prototype.getValue = function (t) {
  return this;
};


function Vector(x, y, attrs) {
  VectorSuper.call(this, attrs);
  this.x = x;
  this.y = y;
  this.keys = ["x", "y"];
  this.tag = "vector";
}

jL.subClass(VectorSuper, Vector);

Vector.prototype.tangent = function (v1, v2, v3, t1, t2, t3) {
  //average of change in values over time
  var t21 = (t2 - t1),
    t32 = (t3 - t2);
  var xtan = ((v2.x - v1.x) / t21 + (v3.x - v2.x) / t32) / 2;
  var ytan = ((v2.y - v1.y) / t21 + (v3.y - v2.y) / t32) / 2;
  return {
    x: xtan,
    y: ytan
  };
};

Vector.prototype.bezier = function (v1, v4, tan1, tan4, t1, t4) {
  var t41 = (t4 - t1);
  var dt = t41 / 4;
  var x = new Bezier(v1.x, v1.x + tan1.x * dt, v4.x - tan4.x * dt, v4.x, t1, t1 + dt, t4 - dt);
  var y = new Bezier(v1.x, v1.x + tan1.x * dt, v4.x - tan4.x * dt, v4.x, t1, t1 + dt, t4 - dt);
  return {
    x: x,
    y: y
  };
};

Vector.prototype.linear = function (v1, v4, tan1, tan4, t1, t4) {
  var t41 = (t4 - t1);
  var dt = t41 / 4;
  var x = new Bezier(v1.x, v1.x + tan1.x * dt, v4.x - tan4.x * dt, v4.x, t1, t1 + dt, t4 - dt);
  var y = new Bezier(v1.x, v1.x + tan1.x * dt, v4.x - tan4.x * dt, v4.x, t1, t1 + dt, t4 - dt);
  return {
    x: x,
    y: y
  };
};

Vector.prototype.between = function (other, percent) {
  return new Vector((other.x - this.x) * percent + this.x, (other.y - this.y) * percent + this.y, this.attrs);
};

function Color(r, g, b, a, attrs) {
  VectorSuper.call(this, attrs);
  this.r = Math.pow(r, 1 / 2.2);
  this.g = Math.pow(g, 1 / 2.2);
  this.b = Math.pow(b, 1 / 2.2);
  this.a = Math.pow(a, 1 / 2.2);
  this.keys = ["r", "g", "b", "a"];
  this.tag = "color";
}

jL.subClass(VectorSuper, Color);

Color.prototype.tangent = function (c1, c2, c3, t1, t2, t3) {
  //average of change in values over time
  var t21 = (t2 - t1),
    t32 = (t3 - t2);
  var rtan = ((c2.r - c1.r) / t21 + (c3.r - c2.r) / t32) / 2;
  var gtan = ((c2.g - c1.g) / t21 + (c3.g - c2.g) / t32) / 2;
  var btan = ((c2.b - c1.b) / t21 + (c3.b - c2.b) / t32) / 2;
  var atan = ((c2.a - c1.a) / t21 + (c3.a - c2.a) / t32) / 2;
  return {
    r: rtan,
    g: gtan,
    b: btan,
    a: atan
  };
};

Color.prototype.bezier = function (c1, c4, tan1, tan4, t1, t4) {
  var t41 = (t4 - t1);
  var dt = t41 / 4;
  var r = new Bezier(c1.r, c1.r + tan1.r * dt, c4.r - tan4.r * dt, c4.r, t1, t1 + dt, t4 - dt);
  var g = new Bezier(c1.g, c1.g + tan1.g * dt, c4.g - tan4.g * dt, c4.g, t1, t1 + dt, t4 - dt);
  var b = new Bezier(c1.b, c1.b + tan1.b * dt, c4.b - tan4.b * dt, c4.b, t1, t1 + dt, t4 - dt);
  var a = new Bezier(c1.a, c1.a + tan1.a * dt, c4.a - tan4.a * dt, c4.a, t1, t1 + dt, t4 - dt);
  return {
    r: r,
    g: g,
    b: b,
    a: a
  };
};


Color.prototype.between = function (other, percent) {
  return new Color((other.r - this.r) * percent + this.r, (other.g - this.g) * percent + this.g, (other.b - this.b) * percent + this.b, (other.a - this.a) * percent + this.a, this.attrs);
};

Color.prototype.toString = function () {
  return "rgba(" + (this.r * 256 >> 0) + "," + (this.g * 256 >> 0) + "," + (this.b * 256 >> 0) + "," + this.a + ")";
};

function Keyframe(time, active, desc, attrs) {
  SIFElement.call(this, attrs);
  this.time = time;
  this.active = active;
  this.desc = desc;
  this.tag = "keyframe";
}

jL.subClass(SIFElement, Keyframe);

Keyframe.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + ' time="' + this.time + '" active="' + this.active + '"' + this.toXMLAttrs(tabs, tab);
  if (!this.desc) {
    return str + '/>\n';
  } else {
    return str + ">" + this.desc.toXML(tabs, tab) + "</keyframe>\n";
  }
};

function Name(content, attrs) {
  SIFElement.call(this, attrs);
  this.content = content;
  this.tag = "name";
}

jL.subClass(SIFElement, Name);

Name.prototype.toXML = function (tabs, tab) {
  return tabs + "<" + this.tag + this.toXMLAttrs(tabs, tab) + ">" + this.content + "</" + this.tag + ">\n";
};


/*
type: String, active: bool, excludeFromRendering: bool, version: number
z_depth : Real, amount: Real, blend_method: static Integer, origin: Vector,
transformation: transformation Composite, canvas: Canvas, time_dilation: Real,
time_offset: Time, children_lock: static Bool, outline_grow: Real, z_range: static Bool,
z_range_position: Real, z_range_depth: Real, z_range_blur: Real
*/

function Layer(type, active, excludeFromRendering, version, desc, attrs) {
  //layer type="group" active="true" exclude_from_rendering="false" version="0.2"
  SIFElement.call(this, attrs);
  this.type = type;
  this.active = active;
  this.excludeFromRendering = excludeFromRendering;
  this.version = version;
  this.keyAttrs = ["type", "active", "excludeFromRendering", "version"];
  if (desc) {
    this.desc = desc;
    this.keyAttrs.push("desc");
  }
  this.paramKeys = [];
  this.tag = "layer";
}

jL.subClass(SIFElement, Layer);

Layer.prototype.addParam = function (key, name, param) {
  this.paramKeys.push([key, name]);
  this[key] = param;
};

Layer.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + this.toXMLAttrs(tabs, tab, this.keyAttrs) + ">\n";
  var nextTabs = tabs + tab;
  for (var i = 0; i < this.paramKeys.length; i++) {
    var pair = this.toUnderscorePair(this.paramKeys[i]);
    str += nextTabs + '<param name="' + pair[1] + '">\n';
    str += this[pair[0]].toXML(nextTabs + tab, tab);
    str += nextTabs + "</param>\n";
  }
  str += this.closeXML(tabs, tab);
  return str;
};

function Meta(name, content, attrs) {
  SIFElement.call(this, attrs);
  this.name = name;
  this.content = content;
  this.tag = "meta";
}

jL.subClass(SIFElement, Meta);

Meta.prototype.toXML = function (tabs, tab) {
  return tabs + "<" + this.tag + ' name="' + this.name + '" content="' + this.content + '"' + this.toXMLAttrs(tabs, tab) + '/>\n';
};

function Real(value, attrs) {
  SIFElement.call(this, attrs);
  this.value = value;
  this.tag = "real";
}

jL.subClass(SIFElement, Real);

Real.prototype.toXML = function (tabs, tab) {
  return tabs + "<" + this.tag + ' value="' + this.value + '"' + this.toXMLAttrs(tabs, tab) + '/>\n';
};

Real.prototype.getValue = function (t) {
  return this.value;
};

Real.prototype.tangent = function (r1, r2, r3, t1, t2, t3) {
  //average of change in values over time
  var tan = ((r2.value - r1.value) / (t2 - t1) + (r3.value - r2.value) / (t3 - t2)) / 2;
  return {
    value: tan
  };
};

Real.prototype.bezier = function (r1, r4, tan1, tan4, t1, t4) {
  var t41 = (t4 - t1);
  var dt = t41 / 4;
  var value = new Bezier(r1.value, r1.value + tan1.value * dt, r4.value - tan4.value * dt, r4.value, t1, t1 + dt, t4 - dt);
  return {
    value: value
  };
};

Real.prototype.between = function (other, percent) {
  return new this.constructor((other.value - this.value) * percent + this.value, this.attrs);
};


function SIFString(value, attrs) {
  SIFElement.call(this, attrs);
  this.value = value;
  this.tag = "string";
}

jL.subClass(Real, SIFString);

SIFString.prototype.between = function (other, percent) {
  return new this.constructor(this.value, this.attrs);
};

function Bool(value, attrs) {
  Real.call(this, value, attrs);
  this.tag = "bool";
}

jL.subClass(Real, Bool);

Bool.prototype.tangent = function () {
  return null;
};

Bool.prototype.bezier = function (b1, b4) {
  return new ConstantBezier(b1, b4);
};

function Integer(value, attrs) {
  Real.call(this, value, attrs);
  this.tag = "integer";
}

jL.subClass(Real, Integer);


Integer.prototype.tangent = function () {
  return null;
};

Integer.prototype.bezier = function (i1, i4) {
  return new ConstantBezier(i1, i4);
};

function Angle(value, attrs) {
  Real.call(this, value, attrs);
  this.tag = "angle";
}

jL.subClass(Real, Angle);

function TagHolder(held, attrs) {
  SIFElement.call(this, attrs);
  this.held = held;
}

jL.subClass(SIFElement, TagHolder);


TagHolder.prototype.toXML = function (tabs, tab) {
  var str = this.openXML(tabs, tab);
  str += this.held.toXML(tabs + tab, tab);
  str += this.closeXML(tabs, tab);
  return str;
};

TagHolder.prototype.getValue = function (t) {
  return this.held.getValue(t);
};

function Waypoint(held, time, before, after, attrs) {
  SIFElement.call(this, attrs);
  this.time = time;
  this.before = "in" + before;
  this.after = "out" + after;
  this.held = held;
  this.tag = "waypoint";
}

jL.subClass(SIFElement, Waypoint);

Waypoint.prototype.getValue = function (t) {
  return this.held.getValue(t);
};

Waypoint.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + ' time="' + this.time + '" before="' + this.before + '" after="' + this.after + '"' + this.toXMLAttrs(tabs, tab) + ">\n";
  str += this.held.toXML(tabs + tab, tab);
  str += this.closeXML(tabs, tab);
  return str;
};

function Animated(type, attrs) {
  SIFElement.call(this, attrs);
  this.type = type;
  this.tag = "animated";
  this.waypoints = [];
  this.times = [];
}

jL.subClass(SIFElement, Animated);

Animated.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + ' type="' + this.type + '"' + this.toXMLAttrs(tabs, tab) + ">\n";
  for (var i = 0; i < this.waypoints.length; i++) {
    str += this.waypoints[i].toXML(tabs + tab, tab);
  }
  str += this.closeXML(tabs, tab);
  return str;
};

Animated.prototype.addWaypoint = function (waypoint) {
  this.waypoints.push(waypoint);
  this.times.push(waypoint.time.absolute());
};

function binaryIndexOf(l, searchElement) {

  var minIndex = 0;
  var maxIndex = l.length - 1;
  var currentIndex = (minIndex + maxIndex) / 2 | 0;
  var currentElement;

  while (minIndex <= maxIndex) {
    currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = l[currentIndex];

    if (currentElement < searchElement) {
      minIndex = currentIndex + 1;
    } else if (currentElement > searchElement) {
      maxIndex = currentIndex - 1;
    } else {
      return currentIndex;
    }
  }

  return currentIndex;
}

Animated.prototype.getValue = function (t) {
  var abs = t.absolute();
  var cind = 0;
  var ind = this.times.length - 1;
  if (abs > this.times[ind]) {
    cind = ind;
  } else {
    ind = binaryIndexOf(this.times, abs);
    //return this.waypoints[ind].getValue(t);
    if (ind == this.times.length - 1) {
      cind = Math.max(ind - 1, 0);
    } else if (ind == 0) {
      cind = ind + 1;
    } else {
      if (abs - this.times[ind] > 0) {
        cind = ind + 1;
      } else {
        cind = ind - 1;
      }
    }
    var cl = ind > cind;
    if (!cl) {
      var t = ind;
      ind = cind;
      cind = t;
    }
  }

  var div = this.times[ind] - this.times[cind];
  var wayA = this.waypoints[cind];
  var wayB = this.waypoints[ind];

  var percent = (abs - this.times[cind]) / (div);
  percent = Math.min(1, percent);
  percent = Math.max(0, percent);
  if (Math.abs(div) < 0.01)
    percent = 1;

  var cut = TweenMath[wayA.after];

  if (percent < cut) {
    percent = Tween[wayA.after](percent);
  } else {
    percent = Tween[wayB.before](percent - cut) + cut;
  }


  wayA = wayA.getValue(t);
  wayB = wayB.getValue(t);
  //console.log(this.type);

  if (wayA.between) {
    return wayA.between(wayB, percent);
  }

  return (wayB - wayA) * percent + wayA;
};

Animated.prototype.createTangents = function () {
  //var tangents
  for (var i = 1; i < this.waypoints.length - 1; i++) {
    this.waypoints.held.tangent();
  }
};

function Bline(type, loop, attrs) {
  SIFElement.call(this, attrs);
  this.type = type;
  this.loop = loop;
  this.tag = "bline";
  this.entries = [];
}

jL.subClass(SIFElement, Bline);

Bline.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + ' type="' + this.type + '"' + ' loop="' + this.loop + '"' + this.toXMLAttrs(tabs, tab) + ">\n";
  var nextTab = tabs + tab;
  for (var i = 0; i < this.entries.length; i++) {
    str += nextTab + "<entry>\n";
    str += this.entries[i].toXML(nextTab + tab, tab);
    str += nextTab + "</entry>\n";
  }
  str += this.closeXML(tabs, tab);
  return str;
};

Bline.prototype.addEntry = function (entry) {
  this.entries.push(entry);
};


function Composite(type, attrs) {
  this.type = type;
  if (this.type == "bline_point") {
    SIFElement.call(this, (arguments.length == 10 ? arguments[9] : undefined));
    this.point = arguments[1];
    this.width = arguments[2];
    this.origin = arguments[3];
    this.split = arguments[4];
    this.t1 = arguments[5];
    this.t2 = arguments[6];
    this.splitRadius = arguments[7];
    this.splitAngle = arguments[8];
    this.keypairs = [["point", "point"],
                    ["width", "width"],
                    ["origin", "origin"],
                    ["split", "split"],
                    ["t1", "t1"],
                    ["t2", "t2"],
                    ["splitRadius", "split_radius"],
                    ["splitAngle", "split_angle"]];
  } else if (this.type == "transformation") {
    SIFElement.call(this, (arguments.length == 6 ? arguments[5] : undefined));
    this.offset = arguments[1];
    this.angle = arguments[2];
    this.skewAngle = arguments[3];
    this.scale = arguments[4];
    this.keypairs = [["offset", "offset"],
                    ["angle", "angle"],
                    ["skewAngle", "skew_angle"],
                    ["scale", "scale"]];
  } else {
    SIFElement.call(this, attrs);
    this.keypairs = [];
  }
  this.tag = "composite";
}

jL.subClass(SIFElement, Composite);

Composite.prototype.toXML = function (tabs, tab) {
  var str = tabs + "<" + this.tag + ' type="' + this.type + '"' + this.toXMLAttrs(tabs, tab) + ">\n";
  var nextTabs = tabs + tab;
  for (var i = 0; i < this.keypairs.length; i++) {
    str += nextTabs + "<" + this.keypairs[i][1] + ">\n";
    str += this[this.keypairs[i][0]].toXML(nextTabs + tab, tab);
    str += nextTabs + "</" + this.keypairs[i][1] + ">\n";
  }
  str += this.closeXML(tabs, tab);
  return str;
};


function RadialComposite(type, radius, theta, attrs) {
  Composite.call(this, null, attrs);
  this.type = type;
  this.tag = "radial_composite";
  this.radius = radius;
  this.theta = theta;
  this.keypairs = [["radius", "radius"],
                    ["theta", "theta"]];
}

jL.subClass(Composite, RadialComposite);

function testAllSif() {
  var vec = new Vector(2, 3, {
    test: "222"
  });
  console.log(vec.toXML("    ", "  "));
  var col = new Color(0.5, 0.7, 0.8, 1, {
    test: "222"
  });
  console.log(col + "");
  console.log(col.toXML("    ", "  "));
  var bool = new Bool(true, {
    test: "222"
  });
  console.log(bool.toXML("    ", "  "));
  var real = new Real(0.5, {
    test: "222"
  });
  console.log(real.toXML("    ", "  "));

  var waypoint = new Waypoint(vec, 0.733324422, "clamped", "clamped", {
    test: "222"
  });
  console.log(waypoint.toXML("    ", "  "));
  var anim = new Animated("vector", {
    test: "222"
  });
  anim.addWaypoint(waypoint);
  anim.addWaypoint(waypoint);
  anim.addWaypoint(waypoint);
  console.log(anim.toXML("    ", "  "));

  var radial_comp1 = new RadialComposite("vector",
    new Real(0),
    new Angle(-45));

  var waypoint_rad_a = new Waypoint(new Real(0, {
    guid: "98B2B48E313025BF7EA6E1D594BEF41C"
  }), 0, "clamped", "clamped");
  var waypoint_rad_b = new Waypoint(new Real(0, {
    guid: "9C4023CFE8029896805ABAC23FF015F4"
  }), 0.70833331, "clamped", "clamped");
  var animated_rad = new Animated("real");
  animated_rad.addWaypoint(waypoint_rad_a);
  animated_rad.addWaypoint(waypoint_rad_b);

  var waypoint_ang_a = new Waypoint(new Real(0, {
    guid: "67F1B8C372CF3A7EDB20922B2ACB6BE5"
  }), 0, "clamped", "clamped");
  var waypoint_ang_b = new Waypoint(new Angle(-45, {
    guid: "737BCAE73EA11364CC87F88EA748E052"
  }), 0.70833331, "clamped", "clamped");
  var animated_ang = new Animated("angle");
  animated_ang.addWaypoint(waypoint_ang_a);
  animated_ang.addWaypoint(waypoint_ang_b);

  var radial_comp_anim = new RadialComposite("vector",
    animated_rad,
    animated_ang);


  //console.log(t1.toXML("    ", "  "));
  //console.log(t2.toXML("    ", "  "));

  var composBlinePoint = new Composite("bline_point",
    new Vector(5, 5), // point
    new Real(4), // width
    new Real(1), // origin
    new Bool(true), // split
    radial_comp_anim, // t1
    radial_comp1, // t2
    new Bool(true), // split radius
    new Bool(true)); // split angle

  var entry = composBlinePoint;
  //console.log(entry.toXML("    ", "  "));

  var bline = new Bline("bline_point", true);
  bline.addEntry(entry);
  bline.addEntry(entry);
  bline.addEntry(entry);
  bline.addEntry(entry);

  console.log(bline.toXML("    ", "  "));

  var meta = new Meta("background_first_color", "0.880000 0.880000 0.880000");

  console.log(meta.toXML("    ", "  "));

  var keyframe = new Keyframe(10, true);

  console.log(keyframe.toXML("    ", "  "));

  var name = new Name("SYNFIG ANIMATION 8");

  console.log(name.toXML("    ", "  "));

}

//testAllSif();




function SIFObject(sifArch, startKey, endKey, onLoopComplete) {
  var keys = sifArch.document.children[1].keyframes;
  this.document = sifArch.document;
  if (startKey == -1) {
    this.starttime = sifArch.starttime;
  } else {
    this.starttime = keys[startKey].time;
  }
  if (endKey == -1) {
    this.endtime = sifArch.endtime;
  } else {
    this.endtime = keys[endKey].time;
  }
  this.currenttime = Time.parse(this.starttime + "");
  this.loops = sifArch.loops;
  this.call = onLoopComplete;
}


SIFObject.prototype.addTime = function (elapsed) {

  this.currenttime.add(elapsed);
  if (this.currenttime.absolute() > this.endtime.absolute()) {
    if (this.loops) {
      this.currenttime.frames = this.starttime.frames;
      this.currenttime.seconds = this.starttime.seconds;
    } else {
      this.currenttime.frames = this.endtime.frames;
      this.currenttime.seconds = this.endtime.seconds;
    }
    if (this.call)
      return this.call(this);
  }
  return true;
};


function loadSif(key) {
  if (SIFRenderer.renderer) {
    if (playBack) {
      clearInterval(playBack);
      playBack = null;
    }
    document.body.removeChild(SIFRenderer.renderer.dCanvas);
    document.body.removeChild(document.body.children[document.body.children.length - 1]);
  }
  SIFRenderer.renderer = null;

  var sifReader = new SIFReader();
  GsifReader = sifReader;

  var lines = mySifs[key].data.split('\n');
  var shouldtrim = true;
  for (var line = 0; line < lines.length; line++) { // 
    var l = lines[line];
    lines[line] = null;
    if (shouldtrim) {
      var i = l.indexOf("<string>");
      if (i != -1) {
        var b = l.substring(0, i).trim();
        l = l.substring(i);

        if (b.length > 0) {
          sifReader.readLine(b);
        }
        shouldtrim = false;
      }
    }
    var i = l.indexOf("</string>");
    if (i != -1) {
      i += 9;

      var b = l.substring(i).trim();
      l = l.substring(0, i);
      sifReader.readLine(l);
      if (b.length > 0) {
        sifReader.readLine(b);
      }
      shouldtrim = true;
    } else {

      if (shouldtrim) {
        l = l.trim();
      }
      sifReader.readLine(l);
    }

  }
  sifReader.document.finish();
  mySifs[key].document = sifReader.document;
  mySifs[key].starttime = Time.parse(mySifs[key].document.children[1].attrs["begin-time"]);
  mySifs[key].endtime = Time.parse(mySifs[key].document.children[1].attrs["end-time"]);
}