const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const sizeRange = document.getElementById("size");
const sizeVal = document.getElementById("sizeVal");
const opacityRange = document.getElementById("opacity");
const opacityVal = document.getElementById("opacityVal");

const modeSelect = document.getElementById("mode");
const productButtons = Array.from(document.querySelectorAll(".chip"));

let state = {
  product: "tshirt",
  mode: "frontBack", // frontBack or frontOnly
  designImg: null,
  dragging: false,
  pointerId: null,
  // design placement in *canvas coordinates*
  // We'll track for front and back separately
  front: { x: 360, y: 300, size: Number(sizeRange.value), opacity: 1 },
  back: { x: 640, y: 300, size: Number(sizeRange.value), opacity: 1 },
  // scale bounds
  lastReset: 0,
};

function setActiveProduct(p) {
  state.product = p;
  productButtons.forEach(b => b.classList.toggle("active", b.dataset.product === p));

  // Auto-set mode based on product:
  if (p === "hat" || p === "socks") {
    state.mode = "frontOnly";
    modeSelect.value = "frontOnly";
  } else {
    state.mode = "frontBack";
    modeSelect.value = "frontBack";
  }
  // Default position reset
  resetPosition();
  render();
}

function resetPosition() {
  const s = Number(sizeRange.value);
  state.front = { x: 360, y: 300, size: s, opacity: Number(opacityRange.value) / 100 };
  state.back  = { x: 640, y: 300, size: s, opacity: Number(opacityRange.value) / 100 };
  state.lastReset = Date.now();
}

function drawBackground() {
  // soft backdrop
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // checker
  for (let i = 0; i < canvas.width; i += 24) {
    for (let j = 0; j < canvas.height; j += 24) {
      const on = ((i + j) / 24) % 2 === 0;
      ctx.fillStyle = on ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.00)";
      ctx.fillRect(i, j, 24, 24);
    }
  }

  // ground panel
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, "#0f0f18");
  grd.addColorStop(1, "#0b0b12");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function roundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawTemplate() {
  // We'll draw two columns: left=front, right=back
  const leftX = 270;
  const rightX = 730;
  const topY = 110;

  const color = "#2b2b36"; // garment outline fill
  const stroke = "rgba(255,255,255,0.18)";

  function drawShirtBody(cx) {
    // torso
    ctx.fillStyle = color;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx - 120, topY + 70);
    ctx.quadraticCurveTo(cx - 160, topY + 140, cx - 140, topY + 220);
    ctx.quadraticCurveTo(cx - 125, topY + 320, cx - 110, topY + 430);
    ctx.quadraticCurveTo(cx - 55, topY + 505, cx, topY + 510);
    ctx.quadraticCurveTo(cx + 55, topY + 505, cx + 110, topY + 430);
    ctx.quadraticCurveTo(cx + 125, topY + 320, cx + 140, topY + 220);
    ctx.quadraticCurveTo(cx + 160, topY + 140, cx + 120, topY + 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // neck
    ctx.beginPath();
    ctx.arc(cx, topY + 70, 28, Math.PI, 0);
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();
  }

  function drawHoodie(cx) {
    drawShirtBody(cx);
    // hood
    ctx.fillStyle = "#242431";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx - 110, topY + 95);
    ctx.quadraticCurveTo(cx - 70, topY + 25, cx, topY + 25);
    ctx.quadraticCurveTo(cx + 70, topY + 25, cx + 110, topY + 95);
    ctx.quadraticCurveTo(cx + 60, topY + 120, cx, topY + 120);
    ctx.quadraticCurveTo(cx - 60, topY + 120, cx - 110, topY + 95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // pocket
    roundedRect(cx - 70, topY + 300, 140, 60, 14);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();
  }

  function drawJoggers(cx) {
    ctx.fillStyle = color;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    // waistband
    roundedRect(cx - 90, topY + 45, 180, 40, 14);
    ctx.fill();
    ctx.stroke();

    // legs (simple curves)
    ctx.beginPath();
    ctx.moveTo(cx - 95, topY + 80);
    ctx.quadraticCurveTo(cx - 165, topY + 120, cx - 155, topY + 210);
    ctx.quadraticCurveTo(cx - 150, topY + 320, cx - 140, topY + 515);
    ctx.quadraticCurveTo(cx - 85, topY + 520, cx - 70, topY + 505);
    ctx.quadraticCurveTo(cx - 90, topY + 400, cx - 70, topY + 240);
    ctx.quadraticCurveTo(cx - 55, topY + 150, cx - 95, topY + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 95, topY + 80);
    ctx.quadraticCurveTo(cx + 155, topY + 120, cx + 155, topY + 210);
    ctx.quadraticCurveTo(cx + 155, topY + 320, cx + 140, topY + 515);
    ctx.quadraticCurveTo(cx + 95, topY + 520, cx + 70, topY + 505);
    ctx.quadraticCurveTo(cx + 95, topY + 400, cx + 70, topY + 240);
    ctx.quadraticCurveTo(cx + 55, topY + 150, cx + 95, topY + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // center draw
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(cx, topY + 120);
    ctx.quadraticCurveTo(cx - 10, topY + 250, cx, topY + 520);
    ctx.stroke();
  }

  function drawHat(cx) {
    // brim + crown
    ctx.fillStyle = "#2a2a36";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    // crown
    ctx.beginPath();
    ctx.ellipse(cx, topY + 90, 110, 80, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // brim
    roundedRect(cx - 120, topY + 140, 240, 60, 18);
    ctx.fillStyle = "#232330";
    ctx.fill();
    ctx.stroke();

    // front panel
    roundedRect(cx - 80, topY + 150, 160, 55, 14);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();
  }

  function drawSocks(cx) {
    ctx.fillStyle = color;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;

    // cuff
    roundedRect(cx - 75, topY + 60, 150, 40, 14);
    ctx.fill();
    ctx.stroke();

    // leg
    ctx.beginPath();
    ctx.moveTo(cx - 70, topY + 85);
    ctx.quadraticCurveTo(cx - 120, topY + 150, cx - 90, topY + 260);
    ctx.quadraticCurveTo(cx - 60, topY + 370, cx - 55, topY + 470);
    ctx.quadraticCurveTo(cx - 5, topY + 520, cx, topY + 500);
    ctx.quadraticCurveTo(cx + 5, topY + 520, cx + 55, topY + 470);
    ctx.quadraticCurveTo(cx + 60, topY + 370, cx + 90, topY + 260);
    ctx.quadraticCurveTo(cx + 120, topY + 150, cx + 70, topY + 85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Choose what to draw
  const drawers = {
    tshirt: drawShirtBody,
    hoodie: drawHoodie,
    joggers: drawJoggers,
    hat: drawHat,
    socks: drawSocks
  };

  // For front+back: draw both columns, otherwise draw centered on left
  const showBack = (state.mode === "frontBack" && state.product !== "hat" && state.product !== "socks");

  if (state.product === "hat" || state.product === "socks") {
    drawers[state.product](leftX);
    return { frontArea: { cx: leftX, cy: 255, w: 220, h: 220 } };
  }

  drawers[state.product](leftX);
  if (showBack) drawers[state.product](rightX);

  // return print areas for design placement
  if (state.product === "joggers") {
    return {
      frontArea: { cx: leftX, cy: 285, w: 120, h: 260 },
      backArea: { cx: rightX, cy: 285, w: 120, h: 260 }
    };
  }
  // tees/hoodies
  return {
    frontArea: { cx: leftX, cy: 260, w: 240, h: 270 },
    backArea: { cx: rightX, cy: 260, w: 240, h: 270 }
  };
}

function drawDesignOn(x, y, size, opacity) {
  if (!state.designImg) return;

  const img = state.designImg;

  // Keep aspect ratio
  const aspect = img.width / img.height;
  const w = size;
  const h = size / aspect;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = true;

  // draw with center anchored at (x,y)
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function drawDesigns() {
  const showBack = (state.mode === "frontBack" && state.product !== "hat" && state.product !== "socks");

  // front
  drawDesignOn(state.front.x, state.front.y, Number(sizeRange.value), Number(opacityRange.value) / 100);

  // back (only if mode says so)
  if (showBack) {
    drawDesignOn(state.back.x, state.back.y, Number(sizeRange.value), Number(opacityRange.value) / 100);
  }
}

function render() {
  drawBackground();

  // template + get placement areas (we don't strictly need them, but helps)
  drawTemplate();

  // design
  drawDesigns();
}

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * sx,
    y: (e.clientY - rect.top) * sy,
  };
}

function hitTestDesign(pt, side) {
  if (!state.designImg) return false;
  const size = Number(sizeRange.value);
  const img = state.designImg;
  const aspect = img.width / img.height;
  const w = size;
  const h = size / aspect;

  const obj = (side === "back") ? state.back : state.front;
  return (
    pt.x >= obj.x - w / 2 &&
    pt.x <= obj.x + w / 2 &&
    pt.y >= obj.y - h / 2 &&
    pt.y <= obj.y + h / 2
  );
}

canvas.addEventListener("pointerdown", (e) => {
  if (!state.designImg) return;

  const pt = canvasPointFromEvent(e);
  const showBack = (state.mode === "frontBack" && state.product !== "hat" && state.product !== "socks");

  // Prefer grabbing whichever side you're closer to (front vs back)
  if (hitTestDesign(pt, "back") && showBack) {
    state.dragging = true;
    state.pointerId = e.pointerId;
    state.dragSide = "back";
  } else if (hitTestDesign(pt, "front")) {
    state.dragging = true;
    state.pointerId = e.pointerId;
    state.dragSide = "front";
  } else {
    state.dragging = false;
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!state.dragging) return;
  if (state.pointerId !== e.pointerId) return;

  const pt = canvasPointFromEvent(e);
  const side = state.dragSide;

  // Keep it inside canvas roughly
  pt.x = Math.max(40, Math.min(canvas.width - 40, pt.x));
  pt.y = Math.max(40, Math.min(canvas.height - 40, pt.y));

  if (side === "front") {
    state.front.x = pt.x;
    state.front.y = pt.y;
  } else {
    state.back.x = pt.x;
    state.back.y = pt.y;
  }
  render();
});

function endDrag(e) {
  if (state.pointerId !== e.pointerId) return;
  state.dragging = false;
  state.pointerId = null;
  state.dragSide = null;
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.designImg = img;
      // Reset placement so user sees it immediately
      resetPosition();
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

downloadBtn.addEventListener("click", () => {
  // Create a downloadable PNG from the canvas
  const link = document.createElement("a");
  link.download = `mockup-${state.product}-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

resetBtn.addEventListener("click", () => {
  resetPosition();
  render();
});

function updateRangesUI() {
  sizeVal.textContent = `${sizeRange.value}px`;
  opacityVal.textContent = `${opacityRange.value}%`;
}

sizeRange.addEventListener("input", () => {
  updateRangesUI();
  // resize already uses range value at draw time; just re-render
  // keep current positions
  render();
});

opacityRange.addEventListener("input", () => {
  updateRangesUI();
  render();
});

modeSelect.addEventListener("change", () => {
  state.mode = modeSelect.value;
  render();
});

// Product buttons
productButtons.forEach(btn => {
  btn.addEventListener("click", () => setActiveProduct(btn.dataset.product));
});

// init
updateRangesUI();
setActiveProduct("tshirt");
render();
