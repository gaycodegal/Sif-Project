var GsifReader;

function getKeyFrames() {
  var keyframes = GsifReader.document.children[1].keyframes;
  console.log(keyframes);
  var template = document.getElementById("keyframeDefault");
  var parent = document.getElementById("excessKeys");
  parent.innerHTML = "";
  for (var i = 0; i < keyframes.length; i++) {
    var div = jL.div("keyframe", undefined, template.innerHTML);
    parent.appendChild(div);
    var radio = div.getElementsByClassName("playback")[0];
    radio.i = i;
    radio.addEventListener("click", function () {
      playKeyframe(this.i);

      this.checked = false;
    });
    div.getElementsByClassName("frame")[0].value = keyframes[i].time.frames;
    div.getElementsByClassName("second")[0].value = keyframes[i].time.seconds;
    div.getElementsByClassName("name")[0].innerHTML = "Keyframe " + i + ":";
    if (keyframes[i].desc) {
      div.getElementsByClassName("desc")[0].value = keyframes[i].desc.text;
    }
    div.getElementsByClassName("active")[0].checked = keyframes[i].active;
  }
}
var playBack = null;

function playKeyframe(i) {
  var keyframes = GsifReader.document.children[1].keyframes;
  document.getElementById("keyframe-details").removeAttribute("open");

  function next() {
    SIFRenderer.renderer.time.add(new Time(1 / Time.fps, 0));
    drawRenderer();
  }
  if (playBack !== null) {
    clearInterval(playBack);
    playBack = null;
  }
  drawRenderer();
  SIFRenderer.renderer.time = Time.parse(keyframes[i].time + "");
  drawRenderer();
  if (document.getElementById("animate").checked)
    playBack = setInterval(next, 1000 / Time.fps);
}

function TagBuilder(parent, tag, attrs, selfClosing) {
  this.attrs = attrs || [];
  this.selfClosing = selfClosing;
  this.tag = tag;
  this.closeTag = selfClosing ? null : "</" + tag + ">";
  this.parent = parent;
  this.children = [];
  this.build();
  this.isComposite = tag.indexOf && (tag.indexOf("composite") != -1);
};

TagBuilder.prototype.addChild = function (child) {
  this.children.push(child);
};


TagBuilder.prototype.build = function (child) {
  for (var i = 0; i < this.attrs.length; i++) {
    var holder = this.attrs[i];
    var ind = holder.indexOf("=");
    if (ind != -1) {
      this.attrs[i] = [];
      this.attrs[i][0] = holder.substring(0, ind).trim();
      this.attrs[i][1] = holder.substring(ind + 1).trim();
      this.attrs[i][1] = this.attrs[i][1].substring(1, this.attrs[i][1].length - 1);
    } else {
      this.attrs[i] = [holder];
    }
  }
};

TagBuilder.documentType = "GlobalDocument";


TagBuilder.prototype.finish = function (child) {
  var key = keyUpper(this.tag);
  if (!this.parent.isComposite && this[key]) {
    this[key]();
  }
};

TagBuilder.prototype.attrsObj = function () {
  var attrs = {};
  for (var i = 0; i < this.attrs.length; i++) {
    if (this.attrs[i].length > 1) {
      attrs[this.attrs[i][0]] = this.attrs[i][1];
    } else {
      attrs[this.attrs[i][0]] = true;
    }
  }
  return attrs;
};

TagBuilder.prototype.vector = function () {
  var x = parseFloat(this.getAllTypeWithAttrEq("x", 0, 0, 1)[0].children[0].text);
  var y = parseFloat(this.getAllTypeWithAttrEq("y", 0, 0, 1)[0].children[0].text);
  var attrs = this.attrsObj();
  var vector = new Vector(x, y, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = vector;
};


TagBuilder.prototype.string = function () {
  var attrs = this.attrsObj();
  var ind = this.parent.children.indexOf(this);
  var str = "";
  for (var i = 0; i < this.children.length; i++) {
    str += this.children[i].text;
    if (i + 1 != this.children.length)
      str += "\n";
  }
  this.parent.children[ind] = new SIFString(str, attrs);
};

TagBuilder.prototype.integer = function () {
  var value = parseInt(this.remAttr("value"));
  var attrs = this.attrsObj();
  var integer = new Integer(value, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = integer;
};

TagBuilder.prototype.real = function () {
  var value = parseFloat(this.remAttr("value"));
  var attrs = this.attrsObj();
  var real = new Real(value, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = real;
};

TagBuilder.prototype.bool = function () {
  var value = this.remAttr("value");
  value = (value != "false");
  var attrs = this.attrsObj();
  var bool = new Bool(value, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = bool;
};

TagBuilder.prototype.angle = function () {
  var value = parseFloat(this.remAttr("value"));
  var attrs = this.attrsObj();
  var angle = new Angle(value, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = angle;
};

TagBuilder.prototype.radialComposite = function () {
  var type = this.remAttr("type");
  var attrs = this.attrsObj();
  var composite = new Composite(null, attrs);
  composite.tag = "radial_composite";
  composite.type = type;
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    var key = keyUpper(child.tag);
    composite[key] = child.children[0];
    composite.keypairs.push([key, child.tag]);
  }

  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = composite;
};


TagBuilder.prototype.composite = function () {
  var type = this.remAttr("type");
  var attrs = {};
  var attrs = this.attrsObj();
  var composite = new Composite(null, attrs);
  composite.tag = "composite";
  composite.type = type;
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    var key = keyUpper(child.tag);
    composite[key] = child.children[0];
    composite.keypairs.push([key, child.tag]);
  }

  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = composite;
};

TagBuilder.prototype.waypoint = function () {
  var time = Time.parse(this.remAttr("time"));

  var before = this.remAttr("before");
  var after = this.remAttr("after");
  var attrs = this.attrsObj();
  var waypoint = new Waypoint(this.children[0], time, before, after, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = waypoint;
};

TagBuilder.prototype.bline = function () {
  var type = this.remAttr("type");
  var loop = this.remAttr("loop");
  loop = (loop != "false");
  var attrs = this.attrsObj();
  var bline = new Bline(type, loop, attrs);
  for (var i = 0; i < this.children.length; i++) {
    bline.addEntry(this.children[i].children[0]);
  }
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = bline;
};

var keyUpper = function (x) {
  return x.replace(/\_./g, function (r) {
    return r.charAt(1).toUpperCase();
  });
};

TagBuilder.prototype.layer = function () {
  //type, active, excludeFromRendering, version, desc, zDepth, amount, blendMethod, origin, transformation, canvas, timeDilation, timeOffset, childrenLock, outlineGrow, zRange, zRangePosition, zRangeDepth, zRangeBlur, attrs
  var type = this.remAttr("type");
  var active = this.remAttr("active");
  active = (active != "false");
  var excludeFromRendering = this.remAttr("exclude_from_rendering");
  excludeFromRendering = (excludeFromRendering != "false");
  var version = this.remAttr("version");
  var desc = this.remAttr("desc");
  var attrs = this.attrsObj();
  var layer = new Layer(type, active, excludeFromRendering, version, desc, attrs);
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    var name = child.attr("name");
    var key = keyUpper(name);
    layer.addParam(key, name, child.children[0]);
  }


  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = layer;
};

TagBuilder.time = new Time()

TagBuilder.prototype.canvas = function () {
  var attrs = this.attrsObj();
  var width = this.attr("width"),
    height = this.attr("height"),
    _vb = this.attr("view-box"),
    scale, origin;
  if (_vb) {
    _vb = _vb.split(" ")
    for (var i = 0; i < 4; i++) {
      _vb[i] = parseFloat(_vb[i]);
    }
    scale = {
      x: width / (_vb[2] - _vb[0]),
      y: height / (_vb[3] - _vb[1])
    };
    origin = {
      x: (_vb[2] - _vb[0]) / 2,
      y: (_vb[3] - _vb[1]) / 2
    };
  }
  var canvas = new Canvas(origin, scale, attrs);
  canvas.tag = "canvas";
  for (var i = 0; i < this.children.length; i++) {
    if (this.children[i].tag == "meta") {
      canvas.metas.push(this.children[i]);
    } else if (this.children[i].tag == "keyframe") {
      canvas.keyframes.push(this.children[i]);
    } else if (this.children[i].tag == "layer") {
      canvas.layers.push(this.children[i]);
    } else {
      canvas.addChild(this.children[i]);
    }
  }
  for (var i = 0; i < canvas.layers.length; i++) {
    var b = i,
      bz = 4294967296;
    for (var j = i; j < canvas.layers.length; j++) {
      var z = canvas.layers[j].zDepth;
      if (z !== undefined) {
        z = z.getValue(TagBuilder.time);
        if (z < bz) {
          b = j;
          bz = z;
        }
      } else {
        b = j;
        break;
      }
    }
    var temp = canvas.layers[i];
    canvas.layers[i] = canvas.layers[b];
    canvas.layers[b] = temp;
  }

  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = canvas;
};

TagBuilder.prototype.name = function () {
  var attrs = this.attrsObj();
  var name = new GeneralElement(attrs);
  name.tag = "name";
  for (var i = 0; i < this.children.length; i++) {
    name.addChild(this.children[i]);
  }
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = name;
};

TagBuilder.prototype.GlobalDocument = function () {
  var doc = new DocumentElement();
  for (var i = 0; i < this.children.length; i++) {
    doc.addChild(this.children[i]);
  }
  this.parent.document = doc;
};

TagBuilder.prototype.meta = function () {
  var name = this.remAttr("name");
  var content = this.remAttr("content");

  var attrs = this.attrsObj();
  var meta = new Meta(name, content, attrs);

  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = meta;
};

TagBuilder.prototype.keyframe = function () {
  var time = Time.parse(this.remAttr("time"));
  var active = this.remAttr("active");
  active = (active != "false");
  var desc = (this.children.length > 0) ? this.children[0] : undefined;
  var attrs = this.attrsObj();
  var keyframe = new Keyframe(time, active, desc, attrs);

  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = keyframe;
};


TagBuilder.prototype.time = function () {
  var value = Time.parse(this.remAttr("value"))
  var attrs = this.attrsObj();
  var time = new GeneralElement(attrs);
  time.tag = "time";
  time.selfClosing = this.selfClosing;
  time.keyAttrs.push("value");
  time.value = value;
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = time;
};



TagBuilder.prototype.animated = function () {
  var type = this.remAttr("type");
  var attrs = this.attrsObj();
  var animated = new Animated(type, attrs);
  for (var i = 0; i < this.children.length; i++) {
    animated.addWaypoint(this.children[i]);
  }
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = animated;
};

TagBuilder.prototype.color = function () {
  var r = parseFloat(this.getAllTypeWithAttrEq("r", 0, 0, 1)[0].children[0].text);
  var g = parseFloat(this.getAllTypeWithAttrEq("g", 0, 0, 1)[0].children[0].text);
  var b = parseFloat(this.getAllTypeWithAttrEq("b", 0, 0, 1)[0].children[0].text);
  var a = parseFloat(this.getAllTypeWithAttrEq("a", 0, 0, 1)[0].children[0].text);
  var attrs = this.attrsObj();
  var color = new Color(r, g, b, a, attrs);
  var ind = this.parent.children.indexOf(this);
  this.parent.children[ind] = color;
};

TagBuilder.prototype.remAttr = function (attr) {
  for (var j = 0; j < this.attrs.length; j++) {
    if (this.attrs[j][0] == attr) {
      var ret = (this.attrs[j].length > 1) ? this.attrs[j][1] : null;
      this.attrs.splice(j, 1);
      return ret;
    }
  }
}

TagBuilder.prototype.attr = function (attr, set) {
  var ind = -1;
  for (var j = 0; j < this.attrs.length; j++) {
    if (this.attrs[j][0] == attr)
      ind = j;
  }
  if (ind == -1) {
    if (arguments.length > 1) {
      if (set == true) {
        this.attrs.push([attr]);
      } else {
        this.attrs.push([attr, set]);
      }
    } else {
      return undefined;
    }
  } else {
    var ary = this.attrs[ind];
    if (arguments.length > 1) {
      if (!set) {
        this.attrs.splice(ind, 1);
      } else {
        if (ary.length > 1)
          ary[1] = set;
        else
          ary.push(set);
      }
    } else {
      if (ary.length > 1)
        return ary[1];
      return true;
    }
  }
};

TagBuilder.prototype.getAllTypeWithAttrEq = function (tag, attr, eq, childrenOnly) {
  var matches = [];
  if (!this.children)
    return matches;
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    if (child.attrs && child.tag == tag) {
      if (!attr) {
        matches.push(child);
      } else {
        var val = child.attr(attr);
        if (val == eq) {
          matches.push(child);
        }
      }
    }
  }
  if (!childrenOnly) {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      if (child.attrs) {
        var match = child.getAllTypeWithAttrEq(type, attr, eq);
        matches.push.apply(matches, match);
      }
    }
  }


  return matches;
};

function SIFReader() {
  this.document = new TagBuilder(null, TagBuilder.documentType);
  this.document.parent = this;
  this.context = this.document;
  this.resetLine();
  this.VERBOSE = !0;
}



/*
close the tag, return context to parent
*/
SIFReader.prototype.closeTag = function () {
  this.context.finish();
  this.context = this.context.parent;
};

/*
open a tag, take context from
*/
SIFReader.prototype.openTag = function (sifTag) {
  if (!sifTag.JKL)
    this.context = sifTag;
};

/*
read in the next sequential line of the file.
*/
SIFReader.prototype.readLine = function (line) {
  if (line == "")
    return;
  this.resetLine();
  this.setLine(line);
  var tag;
  var tags = line.match(/\<([^\"\>\']*((\"((\\\\)*\\\")*(([^\\]((\\\\)*\\\")+)|[^\"])*\")|(\'((\\\\)*\\\')*(([^\\]((\\\\)*\\\')+)|[^\'])*\'))*)*\>/g);
  var selfClosing = false;
  var splits;
  if (!tags) {
    this.context.addChild(new TextElement(line));
    return;
  } else if (tags.length == 1) {
    tag = tags[0];
    splits = line.split(tag);
    if (splits[0].search(/[^\s]/g) != -1) {
      this.context.addChild(new TextElement(splits[0]));
    }



    if (tag.charAt(1) == "/") {
      if (tag == this.context.closeTag) {
        //close tag
        this.closeTag();
        return;
      } else {
        this.context.addChild(new TextElement(line));
        return;
      }
    } else if (tag.charAt(1) == "?") {
      this.context.addChild(new TextElement(line));
      return;
    } else {
      if (tag.charAt(tag.length - 2) == "/") {
        selfClosing = true;
      }
      //open tag
    }
  } else {
    var start = tags[0];
    var end = tags[tags.length - 1];
    this.readLine(start);
    this.readLine(line.substring(start.length, line.length - end.length));
    this.readLine(end);
    return;
  }
  line = tag;

  tag = line.match(/\<[^\s\>]+/g)[0].substring(1);

  line = line.substring(tag.length + 1, line.length - (selfClosing ? 2 : 1));
  var attrs = [];
  var attrs1 = line.match(/[^\s]+\s*=\s*\"((\\\\)*\\\")*(([^\\]((\\\\)*\\\")+)|[^\"])*\"/g);
  if (attrs1)
    attrs = attrs1;
  var i = 0;
  for (; i < attrs.length; i++) {
    line = line.replace(attrs[i], "");
  }

  attrs1 = line.match(/[^\s]+\s*=\s*\'((\\\\)*\\\')*(([^\\]((\\\\)*\\\')+)|[^\'])*\'/g);
  if (attrs1)
    attrs.push.apply(attrs, attrs1);
  for (; i < attrs.length; i++) {
    line = line.replace(attrs[i], "");
  }

  attrs1 = line.match(/[^\s]+/g);
  if (attrs1)
    attrs.push.apply(attrs, attrs1);
  for (; i < attrs.length; i++) {
    line = line.replace(attrs[i], "");
  }
  var newC = new TagBuilder(this.context, tag, attrs, selfClosing);
  this.context.addChild(newC);
  this.context = newC;

  if (selfClosing) {
    this.closeTag();
  }
  if (splits && splits[1].search(/[^\s]/g) != -1) {
    this.context.addChild(new TextElement(splits[1]));
  }
};

/*
set up line
*/
SIFReader.prototype.setLine = function (line) {
  this.length = line.length;
  this.line = line;
};

/*
get the next word, halted by symbol list
*/
SIFReader.prototype.nextWord = function (list, skip) {
  var index = -1;
  if (this.index >= this.length)
    return null;
  var symbol = null;
  var doSkip = true;
  var skipIndex = this.index;
  while (doSkip) {
    for (var i = 0; i < list.length; i++) {
      var sym = list[i];
      var ind = this.line.indexOf(sym, skipIndex);
      if ((ind < index || index == -1) && ind != -1) {
        index = ind;
        symbol = sym;
      }
    }
    doSkip = false;
    skipSym = null;
    symInd = -1;

    for (var i = 0; i < skip.length; i++) {
      var sym = skip[i]
      var ind = this.line.indexOf(sym, skipIndex);
      if ((ind < index || ind < symInd) && ind != -1) {
        skipSym = sym;
        symInd = ind;
      }
    }

    if (skipSym) {
      skipIndex = this.line.indexOf(skipSym, symInd + 1) + 1;
      doSkip = true;
      index = -1;
      symbol = null;
    }

  }


  if (index == -1) {
    var ret = this.line.substring(this.index);
    this.didFinish = true;
    this.isValue = (this.lastSym == "=");
    this.isParam = (this.lastSym == " ");
    this.index = this.length;
    return ret;
  } else {
    var ret = this.line.substring(this.index, index);
    this.index = index + 1;
    this.isValue = (this.lastSym == "=");
    this.isParam = (this.lastSym == " ");
    this.lastSym = symbol;
    return ret;
  }
};


/*
reset the line
*/
SIFReader.prototype.resetLine = function () {
  this.index = 0;
  this.line = "";
  this.length = 0;
  this.didFinish = false;
  this.isValue = false;
  this.isParam = true;
  this.lastSym = null;
};
var ISHIGHDEF = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));

gsSCALE = 1;
try{
  gsSCALE = parseFloat(window.location.href.split("=")[1])||1;
}catch(e){
  
}
function SIFRenderer(doc) {
  this.document = doc;
  this.shouldDrawOr = false;
  this.dCanvas = document.createElement("CANVAS");
  this.sifCanvas = this.document.children[1];
  var mt = 1;
  if (ISHIGHDEF) mt = 2;
  this.dCanvas.width = this.sifCanvas.origin.x * this.sifCanvas.scale.x * 2 * mt * gsSCALE;
  this.dCanvas.height = this.sifCanvas.origin.y * this.sifCanvas.scale.y * 2 * mt * gsSCALE;
  var actw = this.sifCanvas.origin.x * this.sifCanvas.scale.x * 2 * gsSCALE;
  var acth = this.sifCanvas.origin.y * this.sifCanvas.scale.y * 2 * gsSCALE;
  this.dCanvas.style.marginLeft = (-actw / 2) + "px";
  this.dCanvas.style.marginTop = (-acth / 2) + "px";
  this.dCanvas.style.width = actw;
  this.dCanvas.style.height = acth;
  this.dCanvas.className = "centerme";

  document.body.appendChild(this.dCanvas);
  this.ctx = this.dCanvas.getContext("2d");
  if (ISHIGHDEF) this.ctx.scale(2 * gsSCALE, 2 * gsSCALE);
  this.time = new Time();

  this.ctx.lineWidth = 1;

  this.currentTransform = new transformVal({
    x: 0,
    y: 0
  }, {
    x: 0,
    y: 0
  }, {
    x: 1,
    y: 1
  }, 0, {
    x: 1,
    y: 1
  }, 1);
  this.currentTransform.transformOScale(this.sifCanvas.scale);
  this.currentTransform.transformOOrigin(this.sifCanvas.origin);

  this.transformStack = [this.currentTransform.copy()];
  SIFRenderer.renderer = this;
  this.lexicon = {};
}

SIFRenderer.prototype.getLexicon = function (fontname) {
  var l = this.lexicon[fontname];
  if (l)
    return l;
  l = this.lexicon[fontname] = new FontData(this.ctx, fontname);
  return l;
};

function FontData(ctx, fontname) {
  ctx.font = "30px fontname";
  this.unitheight = ctx.measureText("M").width / 30;
}

FontData.prototype.heightOf = function (px) {
  return this.unitheight * px;
};

FontData.prototype.pxOf = function (height) {
  return height / this.unitheight;
};


SIFRenderer.prototype.save = function () {
  this.transformStack.push(this.currentTransform.copy());
};

SIFRenderer.prototype.restore = function () {
  this.currentTransform = this.transformStack.pop();
  this.ctx.globalAlpha = this.currentTransform.a;
};

function transformVal(origin, oOrigin, oScale, angle, scale, alpha) {
  this.origin = {
    x: origin.x,
    y: origin.y
  };
  this.oOrigin = {
    x: oOrigin.x,
    y: oOrigin.y
  };
  this.angle = angle;
  this.theta = angle * Math.PI / 180;
  this.scale = {
    x: scale.x,
    y: scale.y
  };
  this.oScale = {
    x: oScale.x,
    y: oScale.y
  };
  this.scaleR = {
    x: oScale.x * scale.x,
    y: oScale.y * scale.y
  };
  this.a = alpha;
}

transformVal.prototype.copy = function (transform) {
  var ret = new transformVal(this.origin, this.oOrigin, this.oScale, this.angle, this.scale, this.a);
  if (this.clr) {
    var c = this.clr;
    ret.clr = {
      r: c.r,
      g: c.g,
      b: c.b,
      a: c.a
    };
  }
  return ret;
};

transformVal.prototype.transformOrigin = function (transform) {
  this.origin.x += Math.cos(this.theta) * transform.x * this.scaleR.x - Math.sin(this.theta) * transform.y * this.scaleR.y;
  this.origin.y += Math.sin(this.theta) * transform.x * this.scaleR.x + Math.cos(this.theta) * transform.y * this.scaleR.y;
};

transformVal.prototype.transformOOrigin = function (transform) {
  this.oOrigin = {
    x: transform.x * this.oScale.x,
    y: transform.y * this.oScale.y
  };
};

transformVal.prototype.transformAlpha = function (transform) {
  this.a *= transform;
};

transformVal.prototype.transformScalePoint = function (point) {
  return {
    x: point.x * this.scaleR.x - point.y * (-this.scaleR.y),
    y: point.x * this.scaleR.x + point.y * (-this.scaleR.y)
  };
};


transformVal.prototype.transformPoint = function (point) {
  return {
    x: this.oOrigin.x + this.origin.x + Math.cos(this.theta) * point.x * this.scaleR.x - Math.sin(this.theta) * point.y * this.scaleR.y,
    y: this.oOrigin.y + this.origin.y + Math.sin(this.theta) * point.x * this.scaleR.x + Math.cos(this.theta) * point.y * this.scaleR.y
  };
};

transformVal.prototype.transformOScale = function (transform) {
  this.oScale = transform;
  this.scaleR = {
    x: this.oScale.x * this.scale.x,
    y: this.oScale.y * this.scale.y
  };
};

transformVal.prototype.transformScale = function (transform) {
  this.scale.x *= transform.x;
  this.scale.y *= transform.y;
  this.scaleR = {
    x: this.oScale.x * this.scale.x,
    y: this.oScale.y * this.scale.y
  };
};

transformVal.prototype.transformAngle = function (transform) {
  this.angle += transform;
  this.theta = this.angle * Math.PI / 180;
  //this.scaleR.x = Math.cos(this.theta) * this.scale.x - Math.sin(this.theta) * this.scale.y;
  //this.scaleR.y = Math.sin(this.theta) * this.scale.x + Math.cos(this.theta) * this.scale.y;
};

transformVal.prototype.transform = function (translate, angle, scale, alpha) {
  this.transformOrigin(translate);
  this.transformAngle(angle);
  this.transformScale(scale);
  this.transformAlpha(alpha);
};

SIFRenderer.renderer = null;
/*

*/
SIFRenderer.prototype.draw = function () {
  this.ctx.clearRect(0, 0, 1000, 1000);



  this.drawingOrigins = false;
  this.general(this.document);
  if (this.shouldDrawOr) {
    this.drawingOrigins = true;
    this.general(this.document);
  }

};
SIFRenderer.prototype.drawSomething = function (something) {
  this.drawingOrigins = false;
  this.general(something.document);
  if (this.shouldDrawOr) {
    this.drawingOrigins = true;
    this.general(something.document);
  }

};

SIFRenderer.prototype.general = function (sifTag) {
  if (!sifTag)
    return;
  var zChildren = sifTag.children;
  for (var i = 0; i < zChildren.length; i++) {
    if (this[zChildren[i].tag]) {
      this[zChildren[i].tag](zChildren[i]);
    }
  }
};

SIFRenderer.prototype.canvas = function (canvas) {
  if (!canvas)
    return;

  var zChildren = canvas.layers;
  for (var i = 0; i < zChildren.length; i++) {
    if (this[zChildren[i].tag]) {
      this[zChildren[i].tag](zChildren[i]);
    }
  }

};

SIFRenderer.prototype.color = function (color, isFill) {
  if (!color)
    return;
  var color = color.getValue(this.time) + "";
  if (isFill) {
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
  } else {
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
  }
};

SIFRenderer.prototype.drawPt = function (point) {
  var ctx = this.ctx;
  if (this.drawingOrigins) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.restore();
  }
};

SIFRenderer.prototype.getT = function (tx, num, origin) {
  tx = {
    theta: tx.theta.getValue(this.time),
    radius: tx.radius.getValue(this.time)
  };
  this.save();

  this.currentTransform.oOrigin = {
    x: 0,
    y: 0
  };
  if (num == 2) {
    tx.theta = tx.theta;
  } else {
    tx.theta = tx.theta;
    tx.radius = -tx.radius;
  }
  var trans = new transformVal({
    x: 0,
    y: 0
  }, {
    x: 0,
    y: 0
  }, {
    x: 1,
    y: 1
  }, tx.theta, {
    x: 1,
    y: 1
  });

  this.currentTransform.origin = origin;

  var point = {
    x: tx.radius / 3,
    y: 0
  };
  point = trans.transformPoint(point);
  point = this.currentTransform.transformPoint(point);

  this.restore();

  return point;
};

SIFRenderer.prototype.transform = function (trans, amount) {
  if (!trans) {
    if (amount) {
      //console.log(amount.getValue(this.time));
      this.currentTransform.transformAlpha(amount.getValue(this.time));
      this.ctx.globalAlpha = this.currentTransform.a;
    }
    return;
  }
  this.currentTransform.transform(trans.offset.getValue(this.time), -trans.angle.getValue(this.time), trans.scale.getValue(this.time), amount.getValue(this.time));
  this.ctx.globalAlpha = this.currentTransform.a;
};

SIFRenderer.prototype.origin = function (origin, showOr) {
  if (!origin)
    return;
  var origin = origin.getValue(this.time);
  this.currentTransform.transformOrigin({
    x: -origin.x,
    y: -origin.y
  });
  var point = this.currentTransform.transformPoint(origin);
  if (showOr)
    this.drawPt(point);

};

SIFRenderer.prototype.bline = function (bline, isFill) {
  if (!bline)
    return;

  var ctx = this.ctx;
  if (this.drawingOrigins)
    return;
  var points = [];
  var loop = bline.loop;
  var ts = [];
  var entries = bline.entries;
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var point = entry.point.getValue(this.time);
    var pt = this.currentTransform.transformPoint(point);
    points.push(pt);
    ts.push({
      t1: this.getT(entry.t1, 1, pt),
      t2: this.getT(entry.t2, 2, pt)
    });
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (var i = 1; i < points.length; i++) {
    var ta = ts[i - 1].t2;
    var tb = ts[i].t1;
    ctx.bezierCurveTo(ta.x, ta.y, tb.x, tb.y, points[i].x, points[i].y);
  }
  var ta = ts[ts.length - 1].t2;
  var tb = ts[0].t1;
  if (loop) {
    ctx.bezierCurveTo(ta.x, ta.y, tb.x, tb.y, points[0].x, points[0].y);
  }
  if (isFill) {
    if (this.currentTransform.clr) {
      var color = this.currentTransform.clr;
      ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    }
    ctx.fill();
  } else {
    ctx.stroke();
  }

};

SIFRenderer.prototype.layer = function (layer, preTransform) {
  if (!layer)
    return;

  var showOr = layer.type == "group";
  this.save();
  if (!preTransform) {
    layer.trans = this.currentTransform.copy();
  } else {
    var clr = this.currentTransform.clr;
    var trans = layer.trans.copy();
    if (clr)
      trans.clr = clr;
    this.currentTransform = trans;
  }
  this.transform(layer.transformation, layer.amount);
  var origin = this.origin(layer.origin, showOr);

  var type = layer.type;
  if (type == "region" || type == "outline") {
    var isFill = (type == "region");
    this.color(layer.color);
    this.bline(layer.bline, isFill);
  } else if (type == "text") {
    this.ctx.save();
    this.color(layer.color);
    var family = layer.family.getValue(this.time);
    var lex = this.getLexicon(family);
    var size = this.currentTransform.transformScalePoint(layer.size.getValue(this.time));
    size.y *= 0.9;
    this.ctx.font = lex.pxOf(size.y) + "px " + family;
    var orient = layer.orient.getValue(this.time);
    var or = layer.origin.getValue(this.time);
    var ang = this.currentTransform.angle;
    this.currentTransform.angle = 0;
    this.currentTransform.transformOrigin(or);
    var xx = this.currentTransform.transformPoint(or);
    this.ctx.translate(xx.x, xx.y);
    if (ang % 360 != 0) {
      this.ctx.rotate(ang / 180 * Math.PI);
    }
    var centering = 1;
    var text = layer.text.getValue(this.time).split("\n");
    var len = text.length;
    var w = 0;
    for (var i = 0; i < len; i++) {
      var w2 = this.ctx.measureText(text[i]).width;
      if (w2 > w)
        w = w2;
      //console.log("-"+text[i]+"-");
      if (centering) {
        this.ctx.fillText(text[i], or.x - w2 * orient.x, or.y - size.y * (len - 1) * orient.y + i * size.y * 1.2 + (len * 2 - 1) * size.y / 15);

      }

    }
    if (!centering) {
      for (var i = 0; i < len; i++) {
        this.ctx.fillText(text[i], or.x - w * orient.x, or.y - size.y * (len - 1) * orient.y + i * size.y * 1.2 + (len * 2 - 1) * size.y / 15);
      }
    }
    this.ctx.restore();

  }
  layer.fTrans = this.currentTransform.copy();

  this.canvas(layer.canvas);
  SIFRenderer.renderer.restore();
};

/*

*/


/*

*/
var last = 0,
  hideeverything = false;

function drawRenderer() {
  if (!SIFRenderer.renderer) {
    var render = new SIFRenderer(GsifReader.document);
  }
  var elapsed, now = Date.now();
  if (!last)
    elapsed = new Time(1 / Time.fps, 0);
  else
    elapsed = new Time((now - last) / 1000, 0);
  last = now;
  SIFRenderer.renderer.draw();
  var tempTime = SIFRenderer.renderer.time;

  for (var i = 0; i < drawables.length; i++) {
    if (drawables[i].addTime(elapsed)) {
      SIFRenderer.renderer.time = drawables[i].currenttime;
      SIFRenderer.renderer.drawSomething(drawables[i]);
    } else {
      if (hideeverything)
        break;
      i--;
    }
  }
  SIFRenderer.renderer.time = tempTime;
  if (hideeverything) {
    hideeverything = false;
    drawRenderer();
  }
}
var pEditor = null;

function listLayers() {
  var layers = GsifReader.document.getAllTypeWithAttrEq("layer", "type", "group");
  var layerspan = document.getElementById("layer-list");
  layerspan.innerHTML = "";
  for (var i = 0; i < layers.length; i++) {
    var btn = document.createElement("BUTTON");
    btn.innerHTML = layers[i].attr("desc");
    btn.addEventListener("click", (function () {
      pEditor.editing = this;
      pEditor.origin = this.getAllTypeWithAttrEq("param", "name", "origin", 1)[0].origin;
      pEditor.transf = this.getAllTypeWithAttrEq("param", "name", "transformation", 1)[0];
      pEditor.offset = pEditor.transf.offset;
      setFormProps();
      dL(this);
    }).bind(layers[i]));
    layerspan.appendChild(btn);
  }
}

function dL(lr) {
  SIFRenderer.renderer.save();
  SIFRenderer.renderer.currentTransform.clr = {
    r: 0,
    g: 255,
    b: 0,
    a: 1
  };
  SIFRenderer.drawingOrigins = false;
  SIFRenderer.drawTag.layer(lr, SIFRenderer.renderer.ctx, true);
  SIFRenderer.drawingOrigins = true;
  SIFRenderer.drawTag.layer(lr, SIFRenderer.renderer.ctx, true);
  SIFRenderer.renderer.restore();
}

function saveFormProps() {
  var desc = pEditor.form.getElementsByClassName('desc')[0],
    x = pEditor.form.getElementsByClassName('x')[0],
    y = pEditor.form.getElementsByClassName('y')[0],
    ox = pEditor.form.getElementsByClassName('ox')[0],
    oy = pEditor.form.getElementsByClassName('oy')[0];
  pEditor.editing.attr("desc", desc.value);
  pEditor.origin.x = parseFloat(x.value);
  pEditor.origin.y = parseFloat(y.value);
  pEditor.offset.x = parseFloat(ox.value);
  pEditor.offset.y = parseFloat(oy.value);

  SIFRenderer.drawTag.setLiteralNums(pEditor.editing.getAllTypeWithAttrEq("param", "name", "origin", 1)[0], true, pEditor.origin);
  var t = pEditor.editing.getAllTypeWithAttrEq("param", "name", "transformation", 1)[0];
  var o = t.getAllTypeWithAttrEq("offset")[0];
  SIFRenderer.drawTag.setLiteralNums(o, true, pEditor.offset);
}

function setFormProps() {
  var desc = pEditor.form.getElementsByClassName('desc')[0],
    x = pEditor.form.getElementsByClassName('x')[0],
    y = pEditor.form.getElementsByClassName('y')[0],
    ox = pEditor.form.getElementsByClassName('ox')[0],
    oy = pEditor.form.getElementsByClassName('oy')[0];
  desc.value = pEditor.editing.attr("desc");
  x.value = pEditor.origin.x + "";
  y.value = pEditor.origin.y + "";
  ox.value = pEditor.offset.x + "";
  oy.value = pEditor.offset.y + "";
}

function PartEditor() {
  this.editing = null;
  this.shouldMove = false;
  this.shouldRotate = false;
  this.offset = {
    x: 0,
    y: 0
  };
  this.origin = {
    x: 0,
    y: 0
  };
  this.speed = 1;
  this.form = document.getElementById("props");
  window.addEventListener("keydown", (this.keydown).bind(this));
}

PartEditor.prototype.keydown = function (e) {
  if (e.target.nodeName == "INPUT")
    return;
  var key = e.which || e.keyCode;
  switch (key) {
  case 37:
    if (this.shouldMove) {
      this.origin.x -= 1 / this.editing.fTrans.scale.x * this.speed;
      this.offset.x -= 1 / this.editing.trans.scale.x * this.speed;
    } else if (this.shouldRotate) {
      this.transf.angle -= 1 * this.speed;
    }
    break;
  case 39:
    if (this.shouldMove) {
      this.origin.x += 1 / this.editing.fTrans.scale.x * this.speed;
      this.offset.x += 1 / this.editing.trans.scale.x * this.speed;
    } else if (this.shouldRotate) {
      this.transf.angle += 1 * this.speed;
    }
    break;
  case 38:
    if (this.shouldMove) {
      this.origin.y -= 1 / this.editing.fTrans.scale.y * this.speed;
      this.offset.y -= 1 / this.editing.trans.scale.y * this.speed;
    }
    break;
  case 40:
    if (this.shouldMove) {
      this.origin.y += 1 / this.editing.fTrans.scale.y * this.speed;
      this.offset.y += 1 / this.editing.trans.scale.y * this.speed;
    }
    break;
  case 77:
    this.shouldMove = true;
    this.shouldRotate = false;
    break;
  case 219:
    this.speed /= 2;
    break;
  case 221:
    this.speed *= 2;
    break;
  case 82:
    this.shouldMove = false;
    this.shouldRotate = true;
    break;
  default:
    console.log(key);
    return;

  };
  setFormProps();
  SIFRenderer.renderer.draw();
  dL(this.editing);
  e.preventDefault();
  e.stopPropagation();

};

pEditor = new PartEditor();

function testSIFReader() {
  var line = '<canvas name="asdf asdf" parts="asf=">';
  var reader = new SIFReader();
  reader.readLine("<meta/>");
  reader.readLine(line);

}

//testSIFReader();