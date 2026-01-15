// ======================
// PIXEL CASINO (ONE LONG FILE)
// - Classic casino room (walls/ceiling/columns/lights/carpet)
// - Pixelated 3D render (Pixel Gun 3D vibe, adjustable)
// - WASD movement + mouse look (higher sensitivity, not crazy)
// - Slot bank (click buttons)
// - Roulette physics (Cannon ball rail; click wheel)
// - Blackjack UI overlay (click table)
// - Howler kept (generated WAV data URIs; NO audio files needed)
// ======================

console.log("Pixel Casino main.js loaded ✅");

// ---------- Crash catcher ----------
window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message, "at", e.filename + ":" + e.lineno + ":" + e.colno);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("PROMISE ERROR:", e.reason);
});

// ======================
// DOM + base CSS
// ======================
const canvas = document.getElementById("c");
const overlay = document.getElementById("overlay");

(function injectBaseCSS() {
  const css = `
    html, body { margin:0; height:100%; overflow:hidden; background:#000; }
    #c { width:100vw; height:100vh; display:block; image-rendering: pixelated; image-rendering: crisp-edges; }
    #overlay{
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); color:#fff; z-index:9999; cursor:pointer;
      font:700 22px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      user-select:none;
    }
    .uiWrap{
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.55); z-index:9998; backdrop-filter: blur(6px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:#fff;
    }
    .uiCard{
      width:min(560px, 92vw);
      border-radius:18px;
      background:rgba(16,14,24,.92);
      border:1px solid rgba(255,255,255,.10);
      box-shadow:0 30px 80px rgba(0,0,0,.55);
      overflow:hidden;
    }
    .uiHead{
      padding:16px 18px;
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(90deg, rgba(255,43,214,.18), rgba(43,247,255,.10));
      border-bottom:1px solid rgba(255,255,255,.08);
    }
    .uiTitle{ font-weight:900; letter-spacing:.5px; }
    .uiClose{
      cursor:pointer; border:0; background:rgba(255,255,255,.08);
      color:#fff; padding:8px 10px; border-radius:10px;
    }
    .uiBody{ padding:16px 18px 18px; }
    .uiRow{ display:flex; gap:12px; flex-wrap:wrap; }
    .pill{
      padding:10px 12px; border-radius:14px; background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.08);
      min-width: 160px;
    }
    .uiBtns{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .btn{
      cursor:pointer; border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.06);
      color:#fff; padding:10px 12px; border-radius:14px;
      font-weight:800;
    }
    .btnPrimary{
      background:linear-gradient(90deg, rgba(255,43,214,.35), rgba(43,247,255,.22));
      border:1px solid rgba(255,255,255,.18);
    }
    .msg{
      margin-top:12px; padding:10px 12px; border-radius:14px;
      background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.10);
      color:rgba(255,255,255,.92);
      min-height: 22px;
    }
    .hint{
      position:fixed; left:14px; bottom:14px; z-index:9997;
      padding:10px 12px; border-radius:14px;
      background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.12);
      color:rgba(255,255,255,.86);
      font:700 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      max-width: 520px;
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

const hint = document.createElement("div");
hint.className = "hint";
hint.innerHTML = `
  <div><b>WASD</b> move • <b>Shift</b> sprint • <b>Mouse</b> look</div>
  <div>Click: <b>Roulette</b> wheel • <b>Slot</b> buttons • <b>Blackjack</b> table</div>
`;
document.body.appendChild(hint);

// ======================
// HOWLER (kept) — generated sounds (NO files)
// ======================
function wavDataURIFromMonoFloat(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");

  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(off, pcm, true);
    off += 2;
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

function makeNoiseLoop(seconds = 1.3, amp = 0.22, sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const r = (Math.random() * 2 - 1) * amp;
    last = last * 0.93 + r * 0.07;
    s[i] = last;
  }
  return wavDataURIFromMonoFloat(s, sampleRate);
}

function makeClick(seconds = 0.03, amp = 0.95, sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.pow(1 - t, 3);
    s[i] = (Math.random() * 2 - 1) * amp * env;
  }
  return wavDataURIFromMonoFloat(s, sampleRate);
}

function makeTone(freq = 440, seconds = 0.14, amp = 0.25, type = "sine", sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / (0.01 * sampleRate));
    const decay = Math.pow(1 - i / n, 2);
    const env = attack * decay;

    const ph = 2 * Math.PI * freq * t;
    let v = 0;
    if (type === "sine") v = Math.sin(ph);
    else if (type === "square") v = Math.sign(Math.sin(ph));
    else if (type === "saw") v = 2 * (t * freq - Math.floor(0.5 + t * freq));

    s[i] = v * amp * env;
  }
  return wavDataURIFromMonoFloat(s, sampleRate);
}

const SND = {
  ambience: new Howl({ src: [makeNoiseLoop(1.35, 0.22)], loop: true, volume: 0.28 }),
  chip:     new Howl({ src: [makeClick(0.03, 0.95)], volume: 0.65 }),
  roul:     new Howl({ src: [makeTone(160, 0.22, 0.18, "saw")], volume: 0.55 }),
  slotSpin: new Howl({ src: [makeTone(260, 0.18, 0.18, "square")], volume: 0.55 }),
  win1:     new Howl({ src: [makeTone(523.25, 0.14, 0.25, "sine")], volume: 0.85 }),
  win2:     new Howl({ src: [makeTone(659.25, 0.14, 0.22, "sine")], volume: 0.85 }),
  win3:     new Howl({ src: [makeTone(783.99, 0.16, 0.20, "sine")], volume: 0.85 })
};

function playChip() { SND.chip.play(); }
function playRoulette() { SND.roul.play(); }
function playSlotSpin() { SND.slotSpin.play(); }
function playWin() {
  SND.win1.play();
  setTimeout(() => SND.win2.play(), 110);
  setTimeout(() => SND.win3.play(), 220);
}

// ======================
// THREE — renderer + pixel render pipeline
// ======================
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
// Keep tone mapping mild for “pixel 3D” look
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.physicallyCorrectLights = true;

// Shadows help the “room” feel real even with pixelation
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08060d);
scene.fog = new THREE.Fog(0x08060d, 12, 120);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 300);
camera.rotation.order = "YXZ";

// ===== PIXEL SCALE knob =====
// 2 = subtle pixels, 3 = Pixel Gun vibe, 4 = chunkier
let PIXEL_SCALE = 3;

const lowRes = { rt: null, w: 0, h: 0 };
const blitScene = new THREE.Scene();
const blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blitMat = new THREE.MeshBasicMaterial({ map: null });
const blitQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMat);
blitScene.add(blitQuad);

function rebuildLowResTarget() {
  const w = Math.max(1, Math.floor(innerWidth / PIXEL_SCALE));
  const h = Math.max(1, Math.floor(innerHeight / PIXEL_SCALE));
  lowRes.w = w; lowRes.h = h;

  if (lowRes.rt) lowRes.rt.dispose();
  lowRes.rt = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false
  });

  blitMat.map = lowRes.rt.texture;
  blitMat.needsUpdate = true;
}
rebuildLowResTarget();

// ======================
// LIGHTING — classic casino (warm + neon accents)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.06));
scene.add(new THREE.HemisphereLight(0xaec7ff, 0x120014, 0.14));

const spotKey = new THREE.SpotLight(0xfff2d2, 820, 200, Math.PI / 5.5, 0.45, 1.2);
spotKey.position.set(0, 20, 10);
spotKey.target.position.set(0, 0, -10);
spotKey.castShadow = true;
spotKey.shadow.mapSize.set(2048, 2048);
scene.add(spotKey);
scene.add(spotKey.target);

const neonA = new THREE.PointLight(0xff2bd6, 140, 70, 2);
neonA.position.set(-20, 8, 8);
scene.add(neonA);

const neonB = new THREE.PointLight(0x2bf7ff, 140, 70, 2);
neonB.position.set(20, 8, -8);
scene.add(neonB);

const neonC = new THREE.PointLight(0xffd42b, 90, 55, 2);
neonC.position.set(0, 9, -28);
scene.add(neonC);

// ======================
// CLASSIC CASINO ROOM (enclosed interior)
// ======================
const ROOM_W = 120;
const ROOM_D = 120;
const ROOM_H = 22;

const roomBox = new THREE.Mesh(
  new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D),
  new THREE.MeshStandardMaterial({
    color: 0x141018,
    roughness: 0.95,
    metalness: 0.02,
    side: THREE.BackSide
  })
);
roomBox.position.y = ROOM_H / 2;
roomBox.receiveShadow = true;
scene.add(roomBox);

// Ceiling panel
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W - 2, ROOM_D - 2),
  new THREE.MeshStandardMaterial({ color: 0x1b1622, roughness: 0.9, metalness: 0.0 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, ROOM_H - 0.3, 0);
scene.add(ceiling);

// Floor (dark + glossy-ish)
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x070a09,
  roughness: 0.20,
  metalness: 0.06
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Carpet pattern strips
function carpetRow(z, color, emissive = 0x000000) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W - 8, 6),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.98,
      metalness: 0.0,
      emissive,
      emissiveIntensity: 0.15
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.012, z);
  m.receiveShadow = true;
  scene.add(m);
}
for (let i = -9; i <= 9; i++) {
  carpetRow(i * 6, (i % 2 === 0) ? 0x2a1133 : 0x1b0f24, 0x050008);
}

// Columns + neon rings
const colMat = new THREE.MeshStandardMaterial({ color: 0x2a2633, roughness: 0.85, metalness: 0.06 });
function addColumn(x, z) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, ROOM_H - 2, 10), colMat);
  c.position.set(x, (ROOM_H - 2)/2 + 1, z);
  c.castShadow = c.receiveShadow = true;
  scene.add(c);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.10, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 1.05, roughness: 0.25 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, ROOM_H - 3.0, z);
  scene.add(ring);

  const pl = new THREE.PointLight(0xff2bd6, 60, 16, 2);
  pl.position.set(x, ROOM_H - 3.0, z);
  scene.add(pl);
}
const edge = 52;
for (let i = -3; i <= 3; i++) {
  addColumn(-edge, i * 16);
  addColumn(edge, i * 16);
  addColumn(i * 16, -edge);
  addColumn(i * 16, edge);
}

// Ceiling fixtures (visible lights)
const lampMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.6, metalness: 0.2 });
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c6, emissiveIntensity: 1.4, roughness: 0.25 });
function addCeilingLight(x, z) {
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.25, 10), lampMat);
  fixture.position.set(x, ROOM_H - 1.0, z);
  scene.add(fixture);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), bulbMat);
  bulb.position.set(x, ROOM_H - 1.35, z);
  scene.add(bulb);

  const l = new THREE.PointLight(0xfff2c6, 140, 26, 2);
  l.position.set(x, ROOM_H - 1.35, z);
  scene.add(l);
}
for (let x = -24; x <= 24; x += 12) {
  for (let z = -24; z <= 24; z += 12) {
    addCeilingLight(x, z);
  }
}

// Neon sign on back wall
const sign = new THREE.Mesh(
  new THREE.BoxGeometry(14, 3.2, 0.35),
  new THREE.MeshStandardMaterial({
    color: 0x0d0d14,
    emissive: 0xff2bd6,
    emissiveIntensity: 1.1,
    roughness: 0.35
  })
);
sign.position.set(0, 7.0, -ROOM_D/2 + 1.0);
sign.castShadow = true;
scene.add(sign);

const signLight = new THREE.PointLight(0xff2bd6, 140, 40, 2);
signLight.position.set(0, 7.1, -ROOM_D/2 + 3.0);
scene.add(signLight);

// ======================
// Decorative round tables
// ======================
const tableMat = new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.85 });
const feltMat = new THREE.MeshStandardMaterial({ color: 0x0e6b3a, roughness: 0.60, emissive: 0x001a08, emissiveIntensity: 0.35 });

function addRoundTable(x, z) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.28, 18), feltMat);
  top.position.set(x, 1.08, z);
  top.castShadow = top.receiveShadow = true;
  scene.add(top);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 1.45, 12), tableMat);
  stem.position.set(x, 0.70, z);
  stem.castShadow = stem.receiveShadow = true;
  scene.add(stem);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.20, 12), tableMat);
  foot.position.set(x, 0.12, z);
  foot.castShadow = foot.receiveShadow = true;
  scene.add(foot);
}
for (let i = 0; i < 8; i++) addRoundTable(-30 + i*9, -6 + (i%2)*18);

// ======================
// Player + Controls (WASD + mouse look) — higher sensitivity
// ======================
let locked = false;
let started = false;

const keys = { w:false, a:false, s:false, d:false, shift:false };

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyW") keys.w = true;
  if (e.code === "KeyA") keys.a = true;
  if (e.code === "KeyS") keys.s = true;
  if (e.code === "KeyD") keys.d = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
});
document.addEventListener("keyup", (e) => {
  if (e.code === "KeyW") keys.w = false;
  if (e.code === "KeyA") keys.a = false;
  if (e.code === "KeyS") keys.s = false;
  if (e.code === "KeyD") keys.d = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
});

document.addEventListener("pointerlockchange", () => {
  locked = (document.pointerLockElement === renderer.domElement);
});

let yaw = 0, pitch = 0;
const pitchLimit = Math.PI/2 - 0.07;

// Sensitivity (upped, not too crazy)
// Old was ~0.002; this is noticeably faster but still controllable.
const MOUSE_SENS = 0.0034;

document.addEventListener("mousemove", (e) => {
  if (!locked) return;
  yaw   -= e.movementX * MOUSE_SENS;
  pitch -= e.movementY * MOUSE_SENS;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  camera.rotation.set(pitch, yaw, 0);
});

const player = {
  pos: new THREE.Vector3(0, 1.75, 26),
  vel: new THREE.Vector3(0, 0, 0),
  eye: 1.75,
  walk: 4.6,
  sprint: 7.2,
  accel: 22.0,
  friction: 14.0
};
camera.position.copy(player.pos);

function approach(cur, target, delta) {
  if (cur < target) return Math.min(cur + delta, target);
  return Math.max(cur - delta, target);
}

function updateMovement(dt) {
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
  const right   = new THREE.Vector3(1, 0,  0).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);

  const ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  const iz = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

  const input = new THREE.Vector3(ix, 0, iz);
  let wish = new THREE.Vector3();

  if (input.lengthSq() > 0) {
    input.normalize();
    wish.addScaledVector(right, input.x);
    wish.addScaledVector(forward, -input.z);
    wish.normalize();
  }

  const speed = (keys.shift ? player.sprint : player.walk);
  const targetVX = wish.x * speed;
  const targetVZ = wish.z * speed;

  player.vel.x = approach(player.vel.x, targetVX, player.accel * dt);
  player.vel.z = approach(player.vel.z, targetVZ, player.accel * dt);

  if (wish.lengthSq() === 0) {
    player.vel.x = approach(player.vel.x, 0, player.friction * dt);
    player.vel.z = approach(player.vel.z, 0, player.friction * dt);
  }

  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;

  // Clamp inside room
  const boundX = ROOM_W/2 - 2.5;
  const boundZ = ROOM_D/2 - 2.5;
  player.pos.x = THREE.MathUtils.clamp(player.pos.x, -boundX, boundX);
  player.pos.z = THREE.MathUtils.clamp(player.pos.z, -boundZ, boundZ);

  camera.position.set(player.pos.x, player.eye, player.pos.z);

  // Subtle sprint FOV bump
  const moving = (player.vel.x*player.vel.x + player.vel.z*player.vel.z) > 0.25;
  const desiredFov = (keys.shift && moving) ? 78 : 72;
  camera.fov = approach(camera.fov, desiredFov, 12 * dt);
  camera.updateProjectionMatrix();
}

// Start experience (audio + pointer lock)
overlay.addEventListener("click", () => {
  if (!started) {
    started = true;
    overlay.style.display = "none";
    if (!SND.ambience.playing()) SND.ambience.play();
  }
  renderer.domElement.requestPointerLock?.();
});

// ======================
// CANNON — physics (roulette ball)
// ======================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

const mat = new CANNON.Material("m");
world.defaultContactMaterial = new CANNON.ContactMaterial(mat, mat, {
  friction: 0.12,
  restitution: 0.60
});

const groundBody = new CANNON.Body({ mass: 0, material: mat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

// ======================
// Roulette (visual + rail segments)
// ======================
const rouletteGroup = new THREE.Group();
rouletteGroup.position.set(-26, 0, -18);
scene.add(rouletteGroup);

const rouletteBase = new THREE.Mesh(
  new THREE.CylinderGeometry(5.0, 5.3, 0.75, 24),
  new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 })
);
rouletteBase.position.y = 0.38;
rouletteBase.castShadow = rouletteBase.receiveShadow = true;
rouletteGroup.add(rouletteBase);

const rouletteWheel = new THREE.Mesh(
  new THREE.CylinderGeometry(3.85, 3.85, 0.30, 28),
  new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.35, metalness: 0.22 })
);
rouletteWheel.position.y = 0.90;
rouletteWheel.castShadow = rouletteWheel.receiveShadow = true;
rouletteGroup.add(rouletteWheel);

const rouletteRim = new THREE.Mesh(
  new THREE.TorusGeometry(3.75, 0.095, 10, 20),
  new THREE.MeshStandardMaterial({ color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 1.05, roughness: 0.25 })
);
rouletteRim.rotation.x = Math.PI/2;
rouletteRim.position.y = 1.05;
rouletteGroup.add(rouletteRim);

const roulLight = new THREE.PointLight(0x2bf7ff, 90, 24, 2);
roulLight.position.set(rouletteGroup.position.x, 3.2, rouletteGroup.position.z);
scene.add(roulLight);

// Rail
const rouletteCenter = new CANNON.Vec3(rouletteGroup.position.x, 1.05, rouletteGroup.position.z);
const railOuter = 3.52;
const railInner = 2.72;
const railHeight = 0.26;

function addRailSegment(radius, angle, length, thickness, y) {
  const shape = new CANNON.Box(new CANNON.Vec3(length/2, railHeight/2, thickness/2));
  const body = new CANNON.Body({ mass: 0, material: mat });
  body.addShape(shape);

  const x = rouletteCenter.x + Math.cos(angle) * radius;
  const z = rouletteCenter.z + Math.sin(angle) * radius;
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(0, -angle, 0);
  world.addBody(body);
}

const SEG = 40;
for (let i = 0; i < SEG; i++) {
  const a = (i / SEG) * Math.PI * 2;
  addRailSegment(railOuter, a, 0.66, 0.14, 1.10);
  addRailSegment(railInner, a, 0.66, 0.14, 1.10);
}

function inwardForce(body) {
  const dx = body.position.x - rouletteCenter.x;
  const dz = body.position.z - rouletteCenter.z;
  const r = Math.sqrt(dx*dx + dz*dz) || 1;
  const target = (railOuter + railInner) * 0.5;
  const k = 6.0;
  const diff = r - target;
  body.applyForce(new CANNON.Vec3((-dx / r) * diff * k, 0, (-dz / r) * diff * k), body.position);
}

const ballRadius = 0.12;
const ballBody = new CANNON.Body({
  mass: 0.18,
  material: mat,
  linearDamping: 0.10,
  angularDamping: 0.25
});
ballBody.addShape(new CANNON.Sphere(ballRadius));
ballBody.position.set(rouletteCenter.x + railOuter - 0.28, 1.30, rouletteCenter.z);
world.addBody(ballBody);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(ballRadius, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.1 })
);
ballMesh.castShadow = true;
scene.add(ballMesh);

function spinRoulette() {
  ballBody.position.set(rouletteCenter.x + railOuter - 0.28, 1.30, rouletteCenter.z);
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);

  ballBody.applyImpulse(new CANNON.Vec3(0.0, 0.20, 3.1), ballBody.position);

  playRoulette();
  playChip();
}

// ======================
// Slot bank (pixel 3D style)
// ======================
const slots = [];
const coinParticles = [];

const coinGeo = new THREE.SphereGeometry(0.05, 8, 8);
const coinMat = new THREE.MeshStandardMaterial({
  color: 0xffd42b,
  emissive: 0xffd42b,
  emissiveIntensity: 0.9,
  roughness: 0.35
});

function spawnCoins(x, y, z) {
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(coinGeo, coinMat);
    m.position.set(x, y, z);
    m.userData.v = new THREE.Vector3(
      (Math.random() - 0.5) * 3.0,
      2.4 + Math.random() * 2.4,
      (Math.random() - 0.5) * 1.8
    );
    m.userData.life = 0.9 + Math.random() * 0.7;
    m.castShadow = true;
    coinParticles.push(m);
    scene.add(m);
  }
}

function createSlotMachine(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 3.25, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x14141f, roughness: 0.45, metalness: 0.25 })
  );
  body.position.y = 1.62;
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x101018,
    emissive: 0xff2bd6,
    emissiveIntensity: 0.70,
    roughness: 0.35
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.05), screenMat);
  screen.position.set(0, 2.18, 0.735);
  g.add(screen);

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 0.85, roughness: 0.25
  });
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.07, 10, 18), trimMat);
  trim.rotation.x = Math.PI/2;
  trim.position.set(0, 2.18, 0.745);
  g.add(trim);

  const btnMat = new THREE.MeshStandardMaterial({ color: 0x0f0f14, emissive: 0xffd42b, emissiveIntensity: 0.22 });
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), btnMat);
  btn.rotation.x = Math.PI/2;
  btn.position.set(0.74, 1.05, 0.74);
  g.add(btn);

  const glow = new THREE.PointLight(0xff2bd6, 95, 18, 2);
  glow.position.set(x, 3.05, z);
  scene.add(glow);

  return { group: g, button: btn, screenMat, trimMat, btnMat, glow, spinT: 0, winT: 0 };
}

// Slot row
for (let i = 0; i < 7; i++) {
  slots.push(createSlotMachine(6 + i * 3.2, -22));
}

function startSlotSpin(slot) {
  if (slot.spinT > 0) return;
  slot.spinT = 1.2;
  playSlotSpin();
  playChip();
}
function triggerSlotWin(slot) {
  slot.winT = 1.0;
  playWin();
  spawnCoins(slot.group.position.x, 2.0, slot.group.position.z);
}

// ======================
// Blackjack table + UI
// ======================
const bjTable = new THREE.Mesh(
  new THREE.CylinderGeometry(2.6, 2.6, 0.36, 20),
  new THREE.MeshStandardMaterial({ color: 0x0e6b3a, roughness: 0.58, emissive: 0x001a08, emissiveIntensity: 0.35 })
);
bjTable.position.set(0, 1.02, -30);
bjTable.castShadow = bjTable.receiveShadow = true;
scene.add(bjTable);

const bjLight = new THREE.PointLight(0x2bf7ff, 110, 16, 2);
bjLight.position.set(0, 3.0, -30);
scene.add(bjLight);

const uiWrap = document.createElement("div");
uiWrap.className = "uiWrap";
uiWrap.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">BLACKJACK</div>
      <button class="uiClose" id="bjClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="bjBalance">$1000</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="bjBet">$50</div></div>
        <div class="pill"><div><b>Status</b></div><div id="bjStatus">READY</div></div>
      </div>

      <div class="uiRow" style="margin-top:12px;">
        <div class="pill" style="flex:1; min-width:240px;">
          <div><b>Your Hand</b></div>
          <div id="bjPlayerHand">—</div>
          <div id="bjPlayerScore" style="opacity:.9; margin-top:4px;">Score: —</div>
        </div>
        <div class="pill" style="flex:1; min-width:240px;">
          <div><b>Dealer</b></div>
          <div id="bjDealerHand">—</div>
          <div id="bjDealerScore" style="opacity:.9; margin-top:4px;">Score: —</div>
        </div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="bjBetDown">Bet -</button>
        <button class="btn" id="bjBetUp">Bet +</button>
        <button class="btn btnPrimary" id="bjDeal">Deal</button>
        <button class="btn" id="bjHit">Hit</button>
        <button class="btn" id="bjStand">Stand</button>
      </div>

      <div class="msg" id="bjMsg">Click the blackjack table to play.</div>
    </div>
  </div>
`;
document.body.appendChild(uiWrap);

const $ = (id) => document.getElementById(id);

let bj = {
  open: false,
  balance: 1000,
  bet: 50,
  deck: [],
  player: [],
  dealer: [],
  phase: "ready"
};

function bjMakeDeck() {
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["♠","♥","♦","♣"];
  const deck = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({
        r, s,
        label: `${r}${s}`,
        value: (r === "A") ? 11 : (["K","Q","J"].includes(r) ? 10 : Number(r))
      });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjScore(hand) {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter(c => c.r === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function bjUpdateUI(msg) {
  $("bjBalance").textContent = `$${bj.balance}`;
  $("bjBet").textContent = `$${bj.bet}`;
  $("bjStatus").textContent = bj.phase.toUpperCase();

  $("bjPlayerHand").textContent = bj.player.map(c => c.label).join(" ");
  $("bjDealerHand").textContent = bj.dealer.map((c, i) => {
    if (bj.phase === "player" && i === 1) return "🂠";
    return c.label;
  }).join(" ");

  const pScore = bjScore(bj.player);
  const dScore = bj.phase === "player" ? bjScore([bj.dealer[0]]) : bjScore(bj.dealer);

  $("bjPlayerScore").textContent = `Score: ${bj.player.length ? pScore : "—"}`;
  $("bjDealerScore").textContent = `Score: ${bj.dealer.length ? dScore : "—"}`;

  if (msg) $("bjMsg").textContent = msg;
}

function bjOpen() {
  bj.open = true;
  uiWrap.style.display = "flex";
  bjUpdateUI("Ready. Adjust bet or Deal.");
}
function bjClose() {
  bj.open = false;
  uiWrap.style.display = "none";
}
$("bjClose").onclick = bjClose;

$("bjBetUp").onclick = () => {
  if (bj.phase !== "ready") return;
  bj.bet = Math.min(500, bj.bet + 25);
  playChip();
  bjUpdateUI();
};
$("bjBetDown").onclick = () => {
  if (bj.phase !== "ready") return;
  bj.bet = Math.max(25, bj.bet - 25);
  playChip();
  bjUpdateUI();
};

$("bjDeal").onclick = () => {
  if (bj.phase !== "ready") return;
  if (bj.balance < bj.bet) return bjUpdateUI("Not enough balance.");

  bj.balance -= bj.bet;
  playChip();

  bj.deck = bjMakeDeck();
  bj.player = [bj.deck.pop(), bj.deck.pop()];
  bj.dealer = [bj.deck.pop(), bj.deck.pop()];
  bj.phase = "player";

  const p = bjScore(bj.player);
  if (p === 21) {
    const win = Math.floor(bj.bet * 2.5);
    bj.balance += win;
    playWin();
    bjUpdateUI(`BLACKJACK! Profit $${win - bj.bet}.`);
    bj.phase = "ready";
    return;
  }
  bjUpdateUI("Your turn: Hit or Stand.");
};

$("bjHit").onclick = () => {
  if (bj.phase !== "player") return;
  bj.player.push(bj.deck.pop());
  playChip();
  const p = bjScore(bj.player);
  if (p > 21) {
    bjUpdateUI("Bust. Dealer wins.");
    bj.phase = "ready";
    return;
  }
  bjUpdateUI("Hit or Stand?");
};

$("bjStand").onclick = () => {
  if (bj.phase !== "player") return;
  bj.phase = "dealer";

  while (bjScore(bj.dealer) < 17) bj.dealer.push(bj.deck.pop());

  const p = bjScore(bj.player);
  const d = bjScore(bj.dealer);

  if (d > 21 || p > d) {
    bj.balance += bj.bet * 2;
    playWin();
    bjUpdateUI(`You win! Dealer: ${d}. (+$${bj.bet})`);
  } else if (p === d) {
    bj.balance += bj.bet;
    bjUpdateUI(`Push. Dealer: ${d}. (Bet returned)`);
  } else {
    bjUpdateUI(`Dealer wins. Dealer: ${d}.`);
  }

  bj.phase = "ready";
};

// ======================
// Raycast click interactions
// ======================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(e) {
  // overlay click starts game; ignore scene clicks until started
  if (!started) return;
  // if UI open, clicks are UI-only
  if (bj.open) return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const objects = [rouletteWheel, bjTable];
  for (const s of slots) objects.push(s.button);

  const hits = raycaster.intersectObjects(objects, true);
  if (!hits.length) return;

  const hit = hits[0].object;

  if (hit === rouletteWheel) {
    spinRoulette();
    return;
  }
  if (hit === bjTable) {
    bjOpen();
    return;
  }
  for (const s of slots) {
    if (hit === s.button) {
      startSlotSpin(s);
      return;
    }
  }
}
addEventListener("click", onClick);

// ======================
// Loop
// ======================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  const t = clock.elapsedTime;

  // movement
  if (started && !bj.open) updateMovement(dt);

  // vibe pulses
  neonA.position.x = -20 + Math.sin(t * 0.8) * 2.3;
  neonB.position.x =  20 + Math.sin(t * 0.8 + 1.7) * 2.3;
  sign.material.emissiveIntensity = 0.95 + Math.sin(t * 6.0) * 0.30;
  signLight.intensity = 120 + Math.sin(t * 6.0) * 40;

  rouletteWheel.rotation.y += dt * 0.65;
  rouletteRim.material.emissiveIntensity = 0.95 + Math.sin(t * 5.5) * 0.22;

  // slot effects
  for (const s of slots) {
    const idle = 0.55 + Math.sin(t * 5.0 + s.group.position.x * 0.2) * 0.16;

    if (s.spinT <= 0 && s.winT <= 0) {
      s.screenMat.emissiveIntensity = idle;
      s.trimMat.emissiveIntensity = 0.70 + Math.sin(t * 4.0 + 1.2) * 0.18;
      s.glow.intensity = 85 + Math.sin(t * 3.6) * 16;
      s.btnMat.emissiveIntensity = 0.22;
      s.group.scale.set(1,1,1);
      s.group.rotation.y = 0;
    }

    if (s.spinT > 0) {
      s.spinT -= dt;
      const pulse = 1.05 + Math.sin(t * 28.0) * 0.55;
      s.screenMat.emissiveIntensity = pulse;
      s.trimMat.emissiveIntensity = 0.95 + Math.sin(t * 22.0) * 0.40;
      s.glow.intensity = 120;
      s.group.rotation.y = Math.sin(t * 50.0) * 0.02;

      if (s.spinT <= 0) {
        s.group.rotation.y = 0;
        if (Math.random() < 0.48) triggerSlotWin(s);
      }
    }

    if (s.winT > 0) {
      s.winT -= dt;
      const flash = 1.9 + Math.sin(t * 40.0) * 0.85;
      s.screenMat.emissiveIntensity = flash;
      s.trimMat.emissiveIntensity = 1.6 + Math.sin(t * 24.0) * 0.6;
      s.glow.intensity = 160;
      s.btnMat.emissiveIntensity = 1.0;

      const pop = 1.0 + 0.08 * Math.sin((1.0 - s.winT) * 16.0);
      s.group.scale.set(pop, pop, pop);

      if (s.winT <= 0) s.group.scale.set(1,1,1);
    }
  }

  // physics
  world.step(1/60, dt, 3);
  inwardForce(ballBody);
  ballMesh.position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);

  // coins
  for (let i = coinParticles.length - 1; i >= 0; i--) {
    const c = coinParticles[i];
    c.userData.life -= dt;
    c.userData.v.y -= 6.0 * dt;
    c.position.addScaledVector(c.userData.v, dt);
    c.rotation.x += dt * 6;
    c.rotation.y += dt * 8;

    if (c.userData.life <= 0 || c.position.y < 0.05) {
      scene.remove(c);
      coinParticles.splice(i, 1);
    }
  }

  // render pixelated (low-res -> blit)
  renderer.setRenderTarget(lowRes.rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(blitScene, blitCam);
}

animate();

// ======================
// Resize
// ======================
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  rebuildLowResTarget();
});
