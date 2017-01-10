window.onload = function () {

  loadSif("logo");
  loadSif("blackfade");
  loadSif("theatlas");
  loadSif("nmssky");

  loadSif("blank");
  RenderLoop();
  SpiceGame.Init();
};

var SceneContext = {};

var SpiceGame = {};

SpiceGame.Init = function () {
  //SpiceGame.LinearRandom = new LinearRandom(2);
  SpiceGame.RunLogo();
};

SpiceGame.RunLogo = function () {
  drawables.push(new SIFObject(mySifs["logo"], -1, -1, SpiceGame.doneRunLogo));
  return false;
};


SpiceGame.doneRunLogo = function () {
  drawables = [];
  hideeverything = true;
  var sky = new SIFObject(mySifs["nmssky"], -1, -1);
  sky.currenttime.seconds -= 1.3;
  drawables.push(sky);
  drawables.push(new SIFObject(mySifs["theatlas"], -1, -1));
  drawables.push(new SIFObject(mySifs["blackfade"], 0, 1, SpiceGame.RemoveCaller));
  return false;
};

SpiceGame.RemoveCaller = function (caller) {
  drawables.splice(drawables.indexOf(caller), 1);
  return false;
};


function RenderLoop() {
  drawRenderer();
  requestAnimationFrame(RenderLoop);
}
var mySifs = {};
var drawables = [];
