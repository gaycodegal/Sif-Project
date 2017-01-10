window.onload = function () {

  loadSif("logo");
  loadSif("blackfade");
  loadSif("titlescreen");

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
  drawables.push(new SIFObject(mySifs["titlescreen"], -1, -1));
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
