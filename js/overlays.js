function OverlayContainer(){
  this.container = jL.make("div", {className:"centerme sizeme"});
  document.body.appendChild(this.container);
}

OverlayContainer.prototype.remove = function(){
  this.container.parentElement.removeChild(this.container);
};

function OverlayButton(x,y,w,h,title,func, appendTo){
  var c = this.container = jL.make("button", {innerHTML: title, className:"overbutton", onclick: func}), px = "px";
  c.style.width = w + px;
  c.style.height = h + px;
  c.style.left = x + px;
  c.style.top = y + px;
  appendTo.appendChild(this.container);
}

OverlayButton.prototype.remove = OverlayContainer.prototype.remove;


function OverlayText(x,y,w,h,text, appendTo){
  var c = this.container = jL.make("div", {innerHTML: text, className:"overtext"}), px = "px";
  c.style.width = w + px;
  c.style.height = h + px;
  c.style.left = x + px;
  c.style.top = y + px;
  appendTo.appendChild(this.container);
}

OverlayText.prototype.remove = OverlayContainer.prototype.remove;