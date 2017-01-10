
function LinearRandom(s) {
  this.s = s;
  this.mod = Math.pow(2, 32);
}

LinearRandom.prototype.NextMachine = function () {
  return new LinearRandom(Math.abs((this.next() * this.next()) ^ this.next));
};

LinearRandom.prototype.next = function () {
  this.s = ((this.s * 1664525) + 1013904223) % this.mod;
  return this.s;
};

LinearRandom.prototype.intRange = function (min, max) {
  return (Math.round(this.float()*(max - min))) + min;
};

LinearRandom.prototype.range = function (min, max) {
  return this.float() * (max - min) + min;
};

LinearRandom.prototype.float = function () {
  return this.next() / this.mod;
};

LinearRandom.prototype.pick = function (ary) {
  return ary[(this.float()*ary.length)>>0];
};

LinearRandom.prototype.pickWeighted = function (ary) {
  var weight = 0, len = ary.length;
  for(var i = 1; i < len; i += 2){
    weight += ary[i];
  }
  weight = this.next()%weight;
  for(var i = 1; i < len; i += 2){
    if(weight < ary[i])
      return ary[i - 1];
  }
};