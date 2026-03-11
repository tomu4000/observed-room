let floatingParticles = [];
let roomPoints = [];

const FRAME_SIZE = 150;
const FLOATING_COUNT = 950;

// 猫
let cat;
let catObservedTrails = [];

// 箱
let boxArea = {};

// 最初は観測を開始しない
let hasActivatedObservation = false;

// 音
let audioStarted = false;
let bgmStarted = false;
let nextCatSoundFrame = 0;
let nextScratchFrame = 0;
let catPauseAnchorX = 0;
let catPauseAnchorY = 0;

// pointer（マウス / touch 共通）
let pointerX = 0;
let pointerY = 0;
let hasPointer = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  for (let i = 0; i < FLOATING_COUNT; i++) {
    floatingParticles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.22, 0.22),
      vy: random(-0.22, 0.22),
      size: random(1, 2.2)
    });
  }

  createRoomPoints();
  initCat();
  scheduleNextCatSound(true);
  scheduleNextScratch(true);
}

function initCat() {
  cat = {
    x: width * 0.36,
    y: height * 0.84,
    targetX: width * 0.58,
    targetY: height * 0.80,
    state: "walk", // walk, pause, toBox, sleep
    dir: 1,
    speed: 0.65,
    timer: 0,
    sleepTimer: 0,
    posePhase: 0
  };
}

function draw() {
  background(0);

  drawFloatingParticles();
  updateObservation();
  updateCat();
  updateCatSounds();
  updateScratchSound();
  drawObservedRoom();
  drawObservedCatTrails();
  drawObservationFrame();
}

function getPointerPos() {
  return {
    x: hasPointer ? pointerX : mouseX,
    y: hasPointer ? pointerY : mouseY
  };
}

function startAudioIfNeeded() {
  audioStarted = true;
  if (!bgmStarted) {
    startBGM();
  }
}

function drawFloatingParticles() {
  noStroke();

  for (let p of floatingParticles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    fill(210, 230, 255, 68);
    circle(p.x, p.y, p.size);
  }
}

function createRoomPoints() {
  roomPoints = [];

  const floorFrontLeftX = width * -0.02;
  const floorFrontRightX = width * 1.02;
  const floorFrontY = height * 1.02;

  const floorBackLeftX = width * 0.18;
  const floorBackRightX = width * 0.82;
  const floorBackY = height * 0.66;

  const ceilingFrontLeftX = width * -0.01;
  const ceilingFrontRightX = width * 1.01;
  const ceilingFrontY = height * -0.02;

  const ceilingBackLeftX = width * 0.20;
  const ceilingBackRightX = width * 0.80;
  const ceilingBackY = height * 0.14;

  // 床
  addQuadFillPoints(
    floorFrontLeftX, floorFrontY,
    floorFrontRightX, floorFrontY,
    floorBackRightX, floorBackY,
    floorBackLeftX, floorBackY,
    1800
  );
  addLinePoints(floorFrontLeftX, floorFrontY, floorFrontRightX, floorFrontY, 260);
  addLinePoints(floorBackLeftX, floorBackY, floorBackRightX, floorBackY, 180);
  addLinePoints(floorFrontLeftX, floorFrontY, floorBackLeftX, floorBackY, 120);
  addLinePoints(floorFrontRightX, floorFrontY, floorBackRightX, floorBackY, 120);

  // 天井
  addQuadFillPoints(
    ceilingFrontLeftX, ceilingFrontY,
    ceilingFrontRightX, ceilingFrontY,
    ceilingBackRightX, ceilingBackY,
    ceilingBackLeftX, ceilingBackY,
    850
  );
  addLinePoints(ceilingFrontLeftX, ceilingFrontY, ceilingFrontRightX, ceilingFrontY, 180);
  addLinePoints(ceilingBackLeftX, ceilingBackY, ceilingBackRightX, ceilingBackY, 140);
  addLinePoints(ceilingFrontLeftX, ceilingFrontY, ceilingBackLeftX, ceilingBackY, 85);
  addLinePoints(ceilingFrontRightX, ceilingFrontY, ceilingBackRightX, ceilingBackY, 85);

  // 左壁
  addQuadFillPoints(
    floorFrontLeftX, floorFrontY,
    floorBackLeftX, floorBackY,
    ceilingBackLeftX, ceilingBackY,
    ceilingFrontLeftX, ceilingFrontY,
    1000
  );
  addLinePoints(floorFrontLeftX, floorFrontY, floorBackLeftX, floorBackY, 110);
  addLinePoints(ceilingFrontLeftX, ceilingFrontY, ceilingBackLeftX, ceilingBackY, 80);
  addLinePoints(floorFrontLeftX, floorFrontY, ceilingFrontLeftX, ceilingFrontY, 110);
  addLinePoints(floorBackLeftX, floorBackY, ceilingBackLeftX, ceilingBackY, 95);

  // 右壁
  addQuadFillPoints(
    floorBackRightX, floorBackY,
    floorFrontRightX, floorFrontY,
    ceilingFrontRightX, ceilingFrontY,
    ceilingBackRightX, ceilingBackY,
    1000
  );
  addLinePoints(floorFrontRightX, floorFrontY, floorBackRightX, floorBackY, 110);
  addLinePoints(ceilingFrontRightX, ceilingFrontY, ceilingBackRightX, ceilingBackY, 80);
  addLinePoints(floorFrontRightX, floorFrontY, ceilingFrontRightX, ceilingFrontY, 110);
  addLinePoints(floorBackRightX, floorBackY, ceilingBackRightX, ceilingBackY, 95);

  // 奥壁
  addQuadFillPoints(
    floorBackLeftX, floorBackY,
    floorBackRightX, floorBackY,
    ceilingBackRightX, ceilingBackY,
    ceilingBackLeftX, ceilingBackY,
    1200
  );
  addLinePoints(floorBackLeftX, floorBackY, floorBackRightX, floorBackY, 180);
  addLinePoints(ceilingBackLeftX, ceilingBackY, ceilingBackRightX, ceilingBackY, 180);
  addLinePoints(floorBackLeftX, floorBackY, ceilingBackLeftX, ceilingBackY, 110);
  addLinePoints(floorBackRightX, floorBackY, ceilingBackRightX, ceilingBackY, 110);

  createDoor();
  createHangingLight();
  createOutlet();

  createDesk();
  createChair();
  createSofa();
  createHangerRack();
  createBox();
}

function createDoor() {
  const x = width * 0.29;
  const y = height * 0.30;
  const w = width * 0.11;
  const h = height * 0.36;

  addRoundedRectPoints(x, y, w, h, 220);
  addLinePoints(x, y, x + w, y, 45);
  addLinePoints(x, y + h, x + w, y + h, 45);
  addLinePoints(x, y, x, y + h, 50);
  addLinePoints(x + w, y, x + w, y + h, 50);

  addLinePoints(x + w * 0.08, y + h * 0.04, x + w * 0.92, y + h * 0.04, 26);
  addLinePoints(x + w * 0.08, y + h * 0.96, x + w * 0.92, y + h * 0.96, 26);
  addLinePoints(x + w * 0.08, y + h * 0.04, x + w * 0.08, y + h * 0.96, 30);
  addLinePoints(x + w * 0.92, y + h * 0.04, x + w * 0.92, y + h * 0.96, 30);

  addEllipsePoints(x + w * 0.82, y + h * 0.56, width * 0.010, height * 0.018, 18);
}

function createHangingLight() {
  const cx = width * 0.58;
  const topY = height * 0.10;
  const bulbY = height * 0.22;

  addLinePoints(cx, topY, cx, bulbY - height * 0.025, 45);
  addRectPoints(cx - width * 0.008, bulbY - height * 0.035, width * 0.016, height * 0.010, 18);
  addEllipsePoints(cx, bulbY, width * 0.028, height * 0.040, 45);
  addEllipsePoints(cx, bulbY + height * 0.004, width * 0.014, height * 0.018, 20);

  addEllipsePoints(cx, bulbY + height * 0.006, width * 0.065, height * 0.028, 34);
  addEllipsePoints(cx, bulbY + height * 0.008, width * 0.110, height * 0.050, 46);

  for (let i = 0; i < 80; i++) {
    roomPoints.push({
      x: cx + random(-width * 0.07, width * 0.07),
      y: bulbY + random(-height * 0.03, height * 0.08),
      observed: false
    });
  }
}

function createOutlet() {
  // 左壁に貼り付いた感じのコンセント
  const x = width * 0.110;
  const y = height * 0.680;
  const w = width * 0.018;
  const h = height * 0.042;
  const skew = width * 0.010;

  const p1 = { x: x,     y: y };
  const p2 = { x: x + w, y: y - skew * 0.35 };
  const p3 = { x: x + w, y: y + h - skew * 0.35 };
  const p4 = { x: x,     y: y + h };

  addPolygonFillPoints([p1, p2, p3, p4], 46);
  addLinePoints(p1.x, p1.y, p2.x, p2.y, 10);
  addLinePoints(p2.x, p2.y, p3.x, p3.y, 10);
  addLinePoints(p3.x, p3.y, p4.x, p4.y, 10);
  addLinePoints(p4.x, p4.y, p1.x, p1.y, 10);

  const inset = width * 0.0028;
  const q1 = { x: x + inset,     y: y + inset * 1.1 };
  const q2 = { x: x + w - inset, y: y - skew * 0.35 + inset * 0.6 };
  const q3 = { x: x + w - inset, y: y + h - skew * 0.35 - inset * 0.6 };
  const q4 = { x: x + inset,     y: y + h - inset * 1.1 };

  addLinePoints(q1.x, q1.y, q2.x, q2.y, 8);
  addLinePoints(q2.x, q2.y, q3.x, q3.y, 8);
  addLinePoints(q3.x, q3.y, q4.x, q4.y, 8);
  addLinePoints(q4.x, q4.y, q1.x, q1.y, 8);

  const leftSlotX = x + w * 0.34;
  const rightSlotX = x + w * 0.64;

  addLinePoints(leftSlotX,  y + h * 0.26, leftSlotX,  y + h * 0.42, 5);
  addLinePoints(rightSlotX, y + h * 0.24, rightSlotX, y + h * 0.40, 5);
  addLinePoints(leftSlotX,  y + h * 0.59, leftSlotX,  y + h * 0.75, 5);
  addLinePoints(rightSlotX, y + h * 0.57, rightSlotX, y + h * 0.73, 5);
}

function createDesk() {
  const x = width * 0.14;
  const y = height * 0.71;
  const w = width * 0.20;
  const h = height * 0.020;

  addRectPoints(x, y, w, h, 210);
  addLinePoints(x, y, x + w, y, 60);
  addLinePoints(x, y + h, x + w, y + h, 60);

  addLinePoints(x + w * 0.08, y + h, x + w * 0.08, height * 0.90, 42);
  addLinePoints(x + w * 0.28, y + h, x + w * 0.28, height * 0.90, 42);
  addLinePoints(x + w * 0.74, y + h, x + w * 0.74, height * 0.90, 42);
  addLinePoints(x + w * 0.92, y + h, x + w * 0.92, height * 0.90, 42);
}

function createChair() {
  const x = width * 0.20;
  const y = height * 0.78;
  const w = width * 0.08;
  const seatH = height * 0.020;
  const backH = height * 0.09;

  addRoundedRectPoints(x, y, w, seatH, 70);
  addLinePoints(x, y, x + w, y, 18);
  addLinePoints(x, y + seatH, x + w, y + seatH, 18);

  addRoundedRectPoints(x + w * 0.08, y - backH, w * 0.84, backH, 70);
  addLinePoints(x + w * 0.08, y - backH, x + w * 0.92, y - backH, 18);

  addLinePoints(x + w * 0.18, y + seatH, x + w * 0.18, y + height * 0.10, 16);
  addLinePoints(x + w * 0.82, y + seatH, x + w * 0.82, y + height * 0.10, 16);
  addLinePoints(x + w * 0.26, y - backH * 0.1, x + w * 0.26, y, 16);
  addLinePoints(x + w * 0.74, y - backH * 0.1, x + w * 0.74, y, 16);
}

function createSofa() {
  const x = width * 0.49;
  const y = height * 0.70;
  const w = width * 0.25;
  const seatH = height * 0.07;
  const backH = height * 0.12;
  const armW = width * 0.038;
  const baseH = height * 0.028;
  const depthLift = height * 0.014;

  addRoundedRectPoints(x, y - backH, w, backH, 340);
  addRoundedRectPoints(x, y, w, seatH, 320);
  addRectPoints(x + w * 0.02, y + seatH, w * 0.96, baseH, 120);

  addRoundedRectPoints(x - armW, y - height * 0.01, armW, seatH + baseH, 120);
  addRoundedRectPoints(x + w, y - height * 0.01, armW, seatH + baseH, 120);

  addLinePoints(x, y - backH, x + w, y - backH, 80);
  addLinePoints(x, y - backH, x, y + seatH * 0.15, 50);
  addLinePoints(x + w, y - backH, x + w, y + seatH * 0.15, 50);
  addLinePoints(x, y + seatH, x + w, y + seatH, 90);
  addLinePoints(x, y, x + w, y, 70);

  addLinePoints(x - armW, y - height * 0.01, x, y - height * 0.01, 24);
  addLinePoints(x + w, y - height * 0.01, x + w + armW, y - height * 0.01, 24);

  addRoundedRectPoints(x + w * 0.06, y + seatH * 0.08, w * 0.38, seatH * 0.52, 120);
  addRoundedRectPoints(x + w * 0.56, y + seatH * 0.08, w * 0.38, seatH * 0.52, 120);

  addRoundedRectPoints(x + w * 0.06, y - backH * 0.78, w * 0.38, backH * 0.54, 110);
  addRoundedRectPoints(x + w * 0.56, y - backH * 0.78, w * 0.38, backH * 0.54, 110);

  addLinePoints(x + w * 0.50, y + seatH * 0.12, x + w * 0.50, y + seatH * 0.92, 35);
  addLinePoints(x + w * 0.50, y - backH * 0.76, x + w * 0.50, y - backH * 0.08, 35);

  addEllipsePoints(x + w * 0.24, y + seatH * 0.72, w * 0.22, seatH * 0.58, 75);
  addEllipsePoints(x + w * 0.76, y + seatH * 0.72, w * 0.22, seatH * 0.58, 75);

  addLinePoints(x + w * 0.06, y + depthLift, x + w * 0.94, y + depthLift, 45);

  const legY1 = y + seatH + baseH;
  const legY2 = legY1 + height * 0.035;
  addLinePoints(x + w * 0.10, legY1, x + w * 0.10, legY2, 18);
  addLinePoints(x + w * 0.90, legY1, x + w * 0.90, legY2, 18);
  addLinePoints(x + w * 0.18, legY1, x + w * 0.18, legY2, 16);
  addLinePoints(x + w * 0.82, legY1, x + w * 0.82, legY2, 16);
}

function createHangerRack() {
  const leftX = width * 0.77;
  const rightX = width * 0.93;
  const topY = height * 0.24;
  const bottomY = height * 0.90;

  addLinePoints(leftX, topY, rightX, topY, 85);
  addLinePoints(leftX + width * 0.02, topY, leftX + width * 0.02, bottomY, 95);
  addLinePoints(rightX - width * 0.02, topY, rightX - width * 0.02, bottomY, 95);
  addLinePoints(leftX, bottomY, rightX, bottomY, 70);

  addShirt(leftX + width * 0.010, topY + height * 0.05, width * 0.040, height * 0.17);
  addShirt(leftX + width * 0.050, topY + height * 0.055, width * 0.045, height * 0.18);
  addShirt(leftX + width * 0.095, topY + height * 0.048, width * 0.042, height * 0.175);
  addShirt(leftX + width * 0.138, topY + height * 0.058, width * 0.038, height * 0.16);
}

function createBox() {
  const x = width * 0.34;
  const y = height * 0.82;
  const w = width * 0.11;
  const h = height * 0.08;

  boxArea = {
    x: x + w * 0.10,
    y: y + h * 0.08,
    w: w * 0.80,
    h: h * 0.75,
    centerX: x + w * 0.50,
    centerY: y + h * 0.52
  };

  addRectPoints(x, y, w, h, 180);
  addLinePoints(x, y, x + w, y, 38);
  addLinePoints(x, y + h, x + w, y + h, 38);
  addLinePoints(x, y, x, y + h, 28);
  addLinePoints(x + w, y, x + w, y + h, 28);

  addPolygonFillPoints([
    {x:x, y:y},
    {x:x + w * 0.25, y:y - h * 0.18},
    {x:x + w * 0.50, y:y},
    {x:x + w * 0.22, y:y + h * 0.02}
  ], 35);

  addPolygonFillPoints([
    {x:x + w * 0.50, y:y},
    {x:x + w * 0.75, y:y - h * 0.18},
    {x:x + w, y:y},
    {x:x + w * 0.78, y:y + h * 0.02}
  ], 35);

  addLinePoints(x, y, x + w * 0.25, y - h * 0.18, 12);
  addLinePoints(x + w * 0.25, y - h * 0.18, x + w * 0.50, y, 12);
  addLinePoints(x + w * 0.50, y, x + w * 0.75, y - h * 0.18, 12);
  addLinePoints(x + w * 0.75, y - h * 0.18, x + w, y, 12);

  addLinePoints(x + w * 0.50, y + h * 0.08, x + w * 0.50, y + h * 0.92, 20);
}

function addShirt(x, y, w, h) {
  addLinePoints(x + w * 0.50, y - h * 0.22, x + w * 0.34, y - h * 0.10, 10);
  addLinePoints(x + w * 0.50, y - h * 0.22, x + w * 0.66, y - h * 0.10, 10);
  addLinePoints(x + w * 0.34, y - h * 0.10, x + w * 0.66, y - h * 0.10, 14);

  const pts = [
    { x: x + w * 0.32, y: y },
    { x: x + w * 0.22, y: y + h * 0.10 },
    { x: x + w * 0.02, y: y + h * 0.22 },
    { x: x + w * 0.14, y: y + h * 0.42 },
    { x: x + w * 0.26, y: y + h * 0.36 },
    { x: x + w * 0.22, y: y + h * 0.98 },
    { x: x + w * 0.78, y: y + h * 0.98 },
    { x: x + w * 0.74, y: y + h * 0.36 },
    { x: x + w * 0.86, y: y + h * 0.42 },
    { x: x + w * 0.98, y: y + h * 0.22 },
    { x: x + w * 0.78, y: y + h * 0.10 },
    { x: x + w * 0.68, y: y }
  ];

  addPolygonFillPoints(pts, 150);

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    addLinePoints(a.x, a.y, b.x, b.y, 14);
  }

  addLinePoints(x + w * 0.42, y + h * 0.02, x + w * 0.58, y + h * 0.02, 8);
}

function updateCat() {
  cat.timer++;

  if (cat.state === "walk") {
    moveCatToward(cat.targetX, cat.targetY, cat.speed);
    cat.posePhase += 0.12;

    if (dist(cat.x, cat.y, cat.targetX, cat.targetY) < 10) {
      if (random() < 0.28) {
        cat.state = "pause";
        cat.timer = 0;
        catPauseAnchorX = cat.x;
        catPauseAnchorY = cat.y;
      } else if (random() < 0.22) {
        cat.state = "toBox";
        cat.targetX = boxArea.centerX;
        cat.targetY = boxArea.centerY;
      } else {
        chooseNewCatTarget();
      }
    }
  } else if (cat.state === "pause") {
    cat.posePhase += 0.03;
    cat.x = lerp(cat.x, catPauseAnchorX, 0.15);
    cat.y = lerp(cat.y, catPauseAnchorY, 0.15);

    if (cat.timer > int(random(45, 110))) {
      if (random() < 0.30) {
        cat.state = "toBox";
        cat.targetX = boxArea.centerX;
        cat.targetY = boxArea.centerY;
      } else {
        cat.state = "walk";
        chooseNewCatTarget();
      }
      cat.timer = 0;
    }
  } else if (cat.state === "toBox") {
    moveCatToward(cat.targetX, cat.targetY, cat.speed * 0.9);
    cat.posePhase += 0.10;
    if (dist(cat.x, cat.y, cat.targetX, cat.targetY) < 8) {
      cat.state = "sleep";
      cat.sleepTimer = 0;
      cat.timer = 0;
    }
  } else if (cat.state === "sleep") {
    cat.sleepTimer++;
    cat.posePhase += 0.04;
    cat.x = lerp(cat.x, boxArea.centerX, 0.12);
    cat.y = lerp(cat.y, boxArea.centerY + boxArea.h * 0.04, 0.12);

    if (cat.sleepTimer > int(random(180, 360))) {
      cat.state = "walk";
      chooseNewCatTarget();
      cat.timer = 0;
    }
  }

  if (cat.state !== "sleep") {
    cat.dir = cat.targetX >= cat.x ? 1 : -1;
  }

  observeCatIfInsideFrame();
}

function chooseNewCatTarget() {
  cat.targetX = random(width * 0.22, width * 0.78);
  cat.targetY = random(height * 0.73, height * 0.89);
}

function moveCatToward(tx, ty, spd) {
  const dx = tx - cat.x;
  const dy = ty - cat.y;
  const d = sqrt(dx * dx + dy * dy);
  if (d > 0.001) {
    cat.x += (dx / d) * spd;
    cat.y += (dy / d) * spd * 0.55;
  }
}

function observeCatIfInsideFrame() {
  if (!hasActivatedObservation) return;

  const p = getPointerPos();
  const px = p.x;
  const py = p.y;

  if (
    cat.x > px - FRAME_SIZE / 2 &&
    cat.x < px + FRAME_SIZE / 2 &&
    cat.y > py - FRAME_SIZE / 2 &&
    cat.y < py + FRAME_SIZE / 2
  ) {
    let points = getCatPoints(cat.x, cat.y, cat.dir, cat.state === "sleep");
    for (let pt of points) {
      if (
        pt.x > px - FRAME_SIZE / 2 &&
        pt.x < px + FRAME_SIZE / 2 &&
        pt.y > py - FRAME_SIZE / 2 &&
        pt.y < py + FRAME_SIZE / 2
      ) {
        catObservedTrails.push({
          x: pt.x + random(-0.4, 0.4),
          y: pt.y + random(-0.4, 0.4),
          life: 255
        });
      }
    }
  }
}

function getCatPoints(cx, cy, dir, sleeping) {
  let pts = [];

  if (sleeping) {
    pts.push(...ellipseParticlePoints(cx, cy, 52, 28, 70));
    pts.push(...ellipseParticlePoints(cx + 10 * dir, cy - 6, 18, 14, 20));
    pts.push(...triangleParticlePoints(cx + 14 * dir, cy - 12, cx + 20 * dir, cy - 22, cx + 9 * dir, cy - 18, 8));
    pts.push(...triangleParticlePoints(cx + 5 * dir, cy - 13, cx + 11 * dir, cy - 23, cx + 1 * dir, cy - 18, 8));
    pts.push(...curveTailPoints(cx - 14 * dir, cy + 4, dir * -1, 22));
  } else {
    pts.push(...ellipseParticlePoints(cx, cy, 72, 32, 85));
    pts.push(...ellipseParticlePoints(cx + 38 * dir, cy - 12, 24, 21, 28));
    pts.push(...triangleParticlePoints(cx + 42 * dir, cy - 22, cx + 48 * dir, cy - 36, cx + 36 * dir, cy - 29, 10));
    pts.push(...triangleParticlePoints(cx + 31 * dir, cy - 21, cx + 37 * dir, cy - 35, cx + 26 * dir, cy - 28, 10));
    pts.push(...ellipseParticlePoints(cx + 24 * dir, cy - 6, 14, 10, 10));

    let walk = sin(cat.posePhase) * 4;
    pts.push(...lineParticlePoints(cx - 18, cy + 8, cx - 18, cy + 24 + walk, 8));
    pts.push(...lineParticlePoints(cx - 2, cy + 9, cx - 1, cy + 25 - walk, 8));
    pts.push(...lineParticlePoints(cx + 16, cy + 8, cx + 16, cy + 25 + walk, 8));
    pts.push(...lineParticlePoints(cx + 28, cy + 8, cx + 29, cy + 23 - walk, 8));

    pts.push(...curveTailPoints(cx - 40 * dir, cy - 2, -dir, 26));
  }

  return pts;
}

function updateCatSounds() {
  if (!audioStarted) return;
  if (frameCount < nextCatSoundFrame) return;
  if (cat.state === "sleep") {
    scheduleNextCatSound(false);
    return;
  }

  let shouldPlay = false;

  if (cat.state === "pause") {
    shouldPlay = random() < 0.60;
  } else if (cat.state === "walk" || cat.state === "toBox") {
    shouldPlay = random() < 0.28;
  }

  if (shouldPlay) {
    playRandomMeow();
  }

  scheduleNextCatSound(false);
}

function updateScratchSound() {
  if (!audioStarted) return;
  if (frameCount < nextScratchFrame) return;

  if (cat.state === "pause") {
    if (random() < 0.42) {
      playScratch();
    }
  }

  scheduleNextScratch(false);
}

function scheduleNextCatSound(isFirst) {
  if (isFirst) {
    nextCatSoundFrame = frameCount + int(random(180, 420));
    return;
  }

  if (cat.state === "pause") {
    nextCatSoundFrame = frameCount + int(random(160, 360));
  } else if (cat.state === "walk" || cat.state === "toBox") {
    nextCatSoundFrame = frameCount + int(random(260, 700));
  } else {
    nextCatSoundFrame = frameCount + int(random(500, 1000));
  }
}

function scheduleNextScratch(isFirst) {
  if (isFirst) {
    nextScratchFrame = frameCount + int(random(300, 720));
    return;
  }

  if (cat.state === "pause") {
    nextScratchFrame = frameCount + int(random(220, 520));
  } else {
    nextScratchFrame = frameCount + int(random(420, 900));
  }
}

function playRandomMeow() {
  const ids = ["meow1", "meow2", "meow3", "meow4"];
  const picked = random(ids);
  const audio = document.getElementById(picked);
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = random(0.35, 0.60);
  audio.play().catch(() => {});
}

function playScratch() {
  const audio = document.getElementById("scratch1");
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = random(0.20, 0.38);
  audio.play().catch(() => {});
}

function startBGM() {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;

  bgm.volume = 0.26;
  bgm.loop = true;
  bgm.play().then(() => {
    bgmStarted = true;
  }).catch(() => {});
}

function drawObservedCatTrails() {
  noStroke();

  for (let i = catObservedTrails.length - 1; i >= 0; i--) {
    let p = catObservedTrails[i];

    let jitterX = random(-0.45, 0.45);
    let jitterY = random(-0.45, 0.45);

    fill(235, 242, 255, min(160, p.life * 0.65));
    circle(p.x + jitterX, p.y + jitterY, 2.2);

    fill(255, 255, 255, min(46, p.life * 0.18));
    circle(p.x + jitterX, p.y + jitterY, 5.0);

    p.life -= 1.8;

    if (p.life <= 0) {
      catObservedTrails.splice(i, 1);
    }
  }
}

function updateObservation() {
  if (!hasActivatedObservation) return;

  const p = getPointerPos();
  const px = p.x;
  const py = p.y;

  for (const point of roomPoints) {
    if (!point.observed) {
      if (
        point.x > px - FRAME_SIZE / 2 &&
        point.x < px + FRAME_SIZE / 2 &&
        point.y > py - FRAME_SIZE / 2 &&
        point.y < py + FRAME_SIZE / 2
      ) {
        point.observed = true;
      }
    }
  }
}

function drawObservedRoom() {
  noStroke();

  for (const p of roomPoints) {
    if (p.observed) {
      const jitterX = random(-0.85, 0.85);
      const jitterY = random(-0.85, 0.85);

      fill(220, 235, 255, 155);
      circle(p.x + jitterX, p.y + jitterY, 2.3);

      fill(255, 255, 255, 40);
      circle(p.x + jitterX, p.y + jitterY, 5.4);
    }
  }
}

function drawObservationFrame() {
  if (!hasActivatedObservation) return;

  const p = getPointerPos();
  const px = p.x;
  const py = p.y;

  noFill();
  stroke(180, 220, 255, 185);
  strokeWeight(1.2);
  rectMode(CENTER);
  rect(px, py, FRAME_SIZE, FRAME_SIZE);

  stroke(180, 220, 255, 75);
  line(px - FRAME_SIZE / 2, py, px + FRAME_SIZE / 2, py);
  line(px, py - FRAME_SIZE / 2, px, py + FRAME_SIZE / 2);
}

function addLinePoints(x1, y1, x2, y2, count) {
  for (let i = 0; i < count; i++) {
    const t = i / max(count - 1, 1);
    roomPoints.push({
      x: lerp(x1, x2, t) + random(-1.0, 1.0),
      y: lerp(y1, y2, t) + random(-1.0, 1.0),
      observed: false
    });
  }
}

function addRectPoints(x, y, w, h, count) {
  for (let i = 0; i < count; i++) {
    roomPoints.push({
      x: random(x, x + w),
      y: random(y, y + h),
      observed: false
    });
  }
}

function addRoundedRectPoints(x, y, w, h, count) {
  for (let i = 0; i < count; i++) {
    let px = random(x, x + w);
    let py = random(y, y + h);

    const inset = min(w, h) * 0.10;
    if (
      (px < x + inset && py < y + inset) ||
      (px > x + w - inset && py < y + inset) ||
      (px < x + inset && py > y + h - inset) ||
      (px > x + w - inset && py > y + h - inset)
    ) {
      px = lerp(px, x + w / 2, 0.15);
      py = lerp(py, y + h / 2, 0.15);
    }

    roomPoints.push({
      x: px,
      y: py,
      observed: false
    });
  }
}

function addEllipsePoints(cx, cy, w, h, count) {
  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const r = sqrt(random());
    const px = cx + cos(angle) * (w * 0.5) * r;
    const py = cy + sin(angle) * (h * 0.5) * r;

    roomPoints.push({
      x: px + random(-0.7, 0.7),
      y: py + random(-0.7, 0.7),
      observed: false
    });
  }
}

function addQuadFillPoints(x1, y1, x2, y2, x3, y3, x4, y4, count) {
  for (let i = 0; i < count; i++) {
    const u = random();
    const v = random();

    const topX = lerp(x1, x2, u);
    const topY = lerp(y1, y2, u);
    const bottomX = lerp(x4, x3, u);
    const bottomY = lerp(y4, y3, u);

    roomPoints.push({
      x: lerp(topX, bottomX, v) + random(-0.9, 0.9),
      y: lerp(topY, bottomY, v) + random(-0.9, 0.9),
      observed: false
    });
  }
}

function addPolygonFillPoints(points, count) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = min(minX, p.x);
    minY = min(minY, p.y);
    maxX = max(maxX, p.x);
    maxY = max(maxY, p.y);
  }

  let added = 0;
  let tries = 0;
  const maxTries = count * 20;

  while (added < count && tries < maxTries) {
    const px = random(minX, maxX);
    const py = random(minY, maxY);

    if (pointInPolygon(px, py, points)) {
      roomPoints.push({
        x: px + random(-0.5, 0.5),
        y: py + random(-0.5, 0.5),
        observed: false
      });
      added++;
    }

    tries++;
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;

    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 0.00001) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

function ellipseParticlePoints(cx, cy, w, h, count) {
  let pts = [];
  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const r = sqrt(random());
    pts.push({
      x: cx + cos(angle) * (w * 0.5) * r,
      y: cy + sin(angle) * (h * 0.5) * r
    });
  }
  return pts;
}

function triangleParticlePoints(x1, y1, x2, y2, x3, y3, count) {
  let pts = [];
  for (let i = 0; i < count; i++) {
    let a = random();
    let b = random();
    if (a + b > 1) {
      a = 1 - a;
      b = 1 - b;
    }
    let c = 1 - a - b;
    pts.push({
      x: a * x1 + b * x2 + c * x3,
      y: a * y1 + b * y2 + c * y3
    });
  }
  return pts;
}

function lineParticlePoints(x1, y1, x2, y2, count) {
  let pts = [];
  for (let i = 0; i < count; i++) {
    const t = i / max(count - 1, 1);
    pts.push({
      x: lerp(x1, x2, t),
      y: lerp(y1, y2, t)
    });
  }
  return pts;
}

function curveTailPoints(startX, startY, dir, count) {
  let pts = [];
  for (let i = 0; i < count; i++) {
    let t = i / max(count - 1, 1);
    let x = startX + dir * (-10 + t * 24);
    let y = startY - sin(t * PI) * 12 - t * 6;
    pts.push({ x, y });
  }
  return pts;
}

function mouseMoved() {
  pointerX = mouseX;
  pointerY = mouseY;
  hasPointer = true;
  hasActivatedObservation = true;
}

function mouseDragged() {
  pointerX = mouseX;
  pointerY = mouseY;
  hasPointer = true;
  hasActivatedObservation = true;
}

function mousePressed() {
  pointerX = mouseX;
  pointerY = mouseY;
  hasPointer = true;
  hasActivatedObservation = true;
  startAudioIfNeeded();
}

function touchStarted() {
  if (touches.length > 0) {
    pointerX = touches[0].x;
    pointerY = touches[0].y;
    hasPointer = true;
    hasActivatedObservation = true;
    startAudioIfNeeded();
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    pointerX = touches[0].x;
    pointerY = touches[0].y;
    hasPointer = true;
    hasActivatedObservation = true;
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createRoomPoints();
  initCat();
  hasActivatedObservation = false;
  audioStarted = false;
  bgmStarted = false;
  hasPointer = false;
  scheduleNextCatSound(true);
  scheduleNextScratch(true);
}