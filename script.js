console.clear();
TweenLite.defaultEase = Linear.easeNone;

var demo = document.querySelector("#demo");
var groups = [document.querySelector("#demo #outlines"), document.querySelector("#demo #circles") ];
var textGroup = document.querySelector("#demo #text");
var textElements = [];
var svgns = "http://www.w3.org/2000/svg";
var panels = document.querySelectorAll(".panel");

// *********************** adjustable stuff ***********************
var count = panels.length; // how many circles - automatically adjusts to number of panels
var r = 100; // circle radius
var spacer = 25; // space between circles
var strokes = [2, 12]; // [outline stroke width, animating stroke width]
var circleFill = ["transparent", "transparent"]; // [outline circle fill, animating circle fill] 
var colors = ["#000", "#42a6e0"]; // [outline stroke color, animating stroke color]
var opacity = [0.2, 1]; // [outline stroke opacity, animating stroke opacity]  
var fs = r/2; // font-size
// ***********************************************************

var middles = []; // array of circle centers
var oldTarget = 0; // starting target
var newTarget = 0; // new target
var tl; // timeline
var master; // timeline
var oldDraw; // circle animation direction calculation variable 
var newDraw; // circle animation direction calculation variable 
var lineTarget; // line calculation percentage variable
var stretchTarget; // line calculation percentage variable
var demoHeight = r * 2 + strokes[1];
var demoWidth = (r * 2 + spacer) * count - spacer + strokes[1];
var rd;

// trim the SVG to the circles & position gallery panels
TweenMax.set(demo, { attr: { viewBox: "0 0 " + demoWidth + " " + demoHeight, width:demoWidth, height:demoHeight }, xPercent:-50 });
TweenMax.set("#wrap", {xPercent:-50, yPercent:-50});
TweenMax.set(panels, {rotation:180, transformOrigin:"center bottom"});
TweenMax.set(panels[0], {rotation:0});

// loops to create the circles, text and lines needed
for (let j = 0; j < 2; j++) {
  for (let i = 0; i < count; i++) {
    var middle = i * (r * 2) + r + spacer * i + strokes[1] / 2;
    if (j === 0) {
      middles.push(middle);
    }
    var circle = document.createElementNS(svgns, "circle");
    circle.setAttributeNS(null, "cx", middle);
    circle.setAttributeNS(null, "cy", demoHeight/2);
    circle.setAttributeNS(null, "r", r);
    groups[j].appendChild(circle);

    TweenLite.set(circle, {
      stroke: colors[j],
      strokeWidth: strokes[j],
      opacity: opacity[j],
      fill: circleFill[j]
    });
    if (j === 0) {
      var txt = document.createElementNS(svgns, "text");
      txt.setAttributeNS(null, "x", middle);
      txt.setAttributeNS(null, "y", demoHeight/2);
      txt.setAttributeNS(null, "font-size", fs);
      txt.setAttributeNS(null, "text-anchor", "middle");
      txt.setAttributeNS(null, "fill", colors[0]);
      txt.setAttributeNS(null, "opacity", opacity[0]);
      txt.setAttributeNS(null, "dominant-baseline", "central"); //MS Edge doesn't like this
      txt.innerHTML = i + 1;
      textGroup.appendChild(txt);
      textElements.push(txt);
    }
  }

  var line = document.createElementNS(svgns, "line");
  line.setAttributeNS(null, "x1", middles[0]);
  line.setAttributeNS(null, "x2", middles[count - 1]);
  line.setAttributeNS(null, "y1", demoHeight/2 + r);
  line.setAttributeNS(null, "y2", demoHeight/2 + r);
  groups[j].appendChild(line);
  TweenLite.set(line, {
    fill: "none",
    stroke: colors[j],
    strokeWidth: strokes[j],
    opacity: opacity[j]
  });
}

// convert the circles to paths so the correct 6 o'clock starting point works in all browsers
MorphSVGPlugin.convertToPath("#circles circle");
var targets = document.querySelectorAll("#circles path");
// make targets from the paths, add listeners
for (let i = 0; i < targets.length; i++) {
  targets[i].index = i;
  targets[i].addEventListener("click", doCoolStuff);
}
var lineA = document.querySelectorAll("line")[1]; // target for animating line
TweenMax.set(targets, {rotation: 90, transformOrigin: "center center", drawSVG: 0}); // start at 6 o'clock
TweenMax.set(targets[0], {drawSVG: true}); // highlight starting circle
TweenMax.set(textElements[0], {fill:colors[1], opacity:opacity[1]}); // highlight starting text
var startMiddle = middles[0];
TweenMax.set(lineA, {attr:{x1:middles[0], x2:middles[0]}}); // zero out the animating line
var cf = DrawSVGPlugin.getLength( targets[0] ); // circumference needed for durtion calculations




// do all the fancy stuff on click
function doCoolStuff() {
  newTarget = this.index;
  if (oldTarget === newTarget) {
    return;
  }

  if (master && master.isActive()) {
    master.progress(1);
  }

  master = new TimelineMax(); // main timeline
  // figure which way the old and new circle need to draw on/off depending on the travel direction of the line. 
  if (newTarget > oldTarget) {
    // traveling left to right
    oldDraw = { drawSVG: "0% 0%" };
    newDraw = { drawSVG: "100% 100%" };
    lineTarget = middles[oldTarget] + cf;
    stretchTarget = middles[newTarget] - cf;
    rd = 180;
    
  } else {
    // traveling right to left
    oldDraw = { drawSVG: "100% 100%" };
    newDraw = { drawSVG: "0% 0%" };
    lineTarget = middles[oldTarget] - cf;
    stretchTarget = middles[newTarget] + cf;
    rd = -180;
  }

  var dur = 10; // duration value is irrelevant since actual animation is a progress() tween
  var distance = Math.abs(startMiddle - middles[newTarget]); // how far away is the clicked target
  startMiddle = middles[newTarget]; // middle point of target circle
  var totalDistance = distance + cf; // travel distance plus circumference of the circle
  var circDur = cf / totalDistance * dur; // duration for the circle unwrap/wrap
  tl = new TimelineMax({ paused: true }); // line animation timeline
  
  tl.fromTo(targets[oldTarget], circDur, { drawSVG: "0% 100%" }, oldDraw); // erase active circle
  
  if (distance > cf) {
    // line needs to 'unwrap' and travel a bit by itself before wrapping around new target
    tl.to(lineA, circDur, {attr:{x1:middles[oldTarget], x2:lineTarget}}, 0);
    tl.to(lineA, dur-circDur*2, {attr:{x1:stretchTarget, x2:middles[newTarget]}});
    tl.to(lineA, circDur, {attr:{x1:middles[newTarget], x2:middles[newTarget]}}, "part2");
  } else {
    // line needs to start wrapping around new target before fully unwrapped on old target
    tl.to(lineA, dur - circDur, {attr:{x1:middles[oldTarget], x2:middles[newTarget]}}, 0);
    tl.add("part2", dur - circDur);
    tl.to(lineA, dur - circDur, {attr:{x1:middles[newTarget], x2:middles[newTarget]}}, circDur);
  }
  
  tl.fromTo(targets[newTarget], circDur, newDraw, {drawSVG:"0% 100%"}, "part2"); // draw on target circle

  tl.progress(1).progress(0);
  master.to(tl, 1, {progress:1, ease:Power2.easeInOut});
  master.to(textElements[oldTarget], 1, {fill:colors[0], opacity:opacity[0]}, 0);
  master.to(textElements[newTarget], 1, {fill:colors[1], opacity:opacity[1]}, 0);
  master.to(panels[oldTarget], 1, {rotation:-rd, ease:Back.easeIn}, 0);
  master.fromTo(panels[newTarget], 1, {rotation:rd}, {rotation:0, ease:Back.easeOut}, "-=0.35");
  oldTarget = newTarget; // flip values for next click;  

}


// center gallery in the available space above the circle controls
function newSize() {
  var wh = window.innerHeight - demo.getBoundingClientRect().height;
  var ww = window.innerWidth;
  TweenMax.set("#wrap", { top: wh / 2 });
  var factor = 0.88;
  if (wh > ww) {
    TweenMax.set("#wrap", { width: ww * factor, height: ww * factor });
  } else {
    TweenMax.set("#wrap", { width: wh * factor, height: wh * factor });
  }
}

TweenMax.set("#wrap, #demo", { autoAlpha: 1 });
newSize();
window.addEventListener("resize", newSize);