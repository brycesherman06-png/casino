// ======================
// FULL-SCALE CASINO MAIN
// Three.js + Howler + Cannon (no audio files needed)
// ======================

console.log("Casino main.js loaded ✅");

// ---- Crash catcher (prevents silent blank screen) ----
window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message, "at", e.filename + ":" + e.lineno + ":" + e.colno);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("PROMISE ERROR:", e.reason);
});

// ======================
// DOM
// ======================
const canvas = document.getElementById("c");
const overlay = document.getElementById("overlay");

// ======================
// Howler sounds WITHOUT files (generated WAV data URIs)
// ======================
function wavDataURIFromMonoFloat(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit PCM
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
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, 1, true);  // mono
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

function makeNoiseLoop(seconds = 1.2, amp = 0.20, sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const r = (Math.random() * 2 - 1) * amp;
    last = last * 0.93 + r * 0.07; // smooth noise bed
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
  ambience: new Howl({ src: [makeNoiseLoop(1.3, 0.22)], loop: true, volume: 0.32 }),
  chip:     new Howl({ src: [makeClick(0.03, 0.95)], volume: 0.65 }),
  roul:     new Howl({ src: [makeTone(160, 0.22, 0.18, "saw")], volume: 0.60 }),
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

// Start ambience after user gesture
overlay.addEventListener("click", () => {
  overlay.style.display = "none";
  if (!SND.ambience.playing()) SND.ambience.play();
}, { once: true });

// ======================
// Three.js Setup
// ======================
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05040a);
scene.fog = new THREE.Fog(0x05040a, 10, 95);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 250);
camera.position.set(0, 2.2, 14);
camera.rotation.order = "YXZ";

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.08));
scene.add(new THREE.HemisphereLight(0x8bbcff, 0x150018, 0.22));

const key = new THREE.DirectionalLight(0xffffff, 0.35);
key.position.set(7, 12, 5);
scene.add(key);

const neonA = new THREE.PointLight(0xff2bd6, 1.2, 60, 2);
neonA.position.set(-12, 7, 2);
scene.add(neonA);

const neonB = new THREE.PointLight(0x2bf7ff, 1.1, 60, 2);
neonB.position.set(12, 7, -2);
scene.add(neonB);

const neonC = new THREE.PointLight(0xffd42b, 0.8, 45, 2);
neonC.position.set(0, 8, -18);
scene.add(neonC);

// Floor
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0b1a12, roughness: 0.32, metalness: 0.12,
  emissive: 0x001006, emissiveIntensity: 0.35
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// Glow strips
function glowStrip(x, z, w, d, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.02, d),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.0 })
  );
  m.position.set(x, 0.011, z);
  scene.add(m);
}
for (let i = -4; i <= 4; i++) {
  glowStrip(i * 7.5, -8, 5.6, 0.24, 0xff2bd6);
  glowStrip(i * 7.5,  8, 5.6, 0.24, 0x2bf7ff);
}

// Walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0x15131e, roughness: 0.9, metalness: 0.05 });
const room = 44, wallH = 9, wallT = 0.6;
function wall(w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  m.position.set(x, y, z);
  scene.add(m);
}
wall(room*2, wallH, wallT, 0, wallH/2, -room);
wall(room*2, wallH, wallT, 0, wallH/2,  room);
wall(wallT, wallH, room*2, -room, wallH/2, 0);
wall(wallT, wallH, room*2,  room, wallH/2, 0);

// Neon sign
const sign = new THREE.Mesh(
  new THREE.BoxGeometry(12, 3, 0.35),
  new THREE.MeshStandardMaterial({ color: 0x0d0d14, emissive: 0xff2bd6, emissiveIntensity: 1.25, roughness: 0.4 })
);
sign.position.set(0, 6.0, -room + 0.8);
scene.add(sign);

const signLight = new THREE.PointLight(0xff2bd6, 1.4, 35, 2);
signLight.position.set(0, 6.2, -room + 2.2);
scene.add(signLight);

// Tables (decoration)
const tableMat = new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.85 });
const feltMat = new THREE.MeshStandardMaterial({
  color: 0x0e6b3a, roughness: 0.55,
  emissive: 0x001a08, emissiveIntensity: 0.55
});

function addTable(x, z) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 28), feltMat);
  top.position.set(x, 1.05, z);
  scene.add(top);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 18), tableMat);
  stem.position.set(x, 0.7, z);
  scene.add(stem);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.18, 22), tableMat);
  foot.position.set(x, 0.12, z);
  scene.add(foot);

  const chipGlow = new THREE.PointLight(0x2bf7ff, 0.55, 10, 2);
  chipGlow.position.set(x, 1.3, z);
  scene.add(chipGlow);
}
for (let i = 0; i < 10; i++) addTable(-20 + i*4.5, -10 + (i%2)*20);

// ======================
// Pointer lock (just for looking around)
// ======================
let locked = false;
overlay.addEventListener("click", () => {
  renderer.domElement.requestPointerLock?.();
}, { once: false });

document.addEventListener("pointerlockchange", () => {
  locked = (document.pointerLockElement === renderer.domElement);
});

let yaw = 0, pitch = 0;
const pitchLimit = Math.PI / 2 - 0.06;
addEventListener("mousemove", (e) => {
  if (!locked) return;
  const sens = 0.002;
  yaw   -= e.movementX * sens;
  pitch -= e.movementY * sens;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  camera.rotation.set(pitch, yaw, 0);
});

// ======================
// Cannon.js Physics Setup
// ======================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

const mat = new CANNON.Material("m");
world.defaultContactMaterial = new CANNON.ContactMaterial(mat, mat, {
  friction: 0.12,
  restitution: 0.58
});

// Ground plane
const groundBody = new CANNON.Body({ mass: 0, material: mat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

// ======================
// Roulette (visual + physics rail + ball)
// ======================
const rouletteGroup = new THREE.Group();
rouletteGroup.position.set(-14, 0, -8);
scene.add(rouletteGroup);

const tableBase = new THREE.Mesh(
  new THREE.CylinderGeometry(4.8, 5.1, 0.7, 52),
  new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 })
);
tableBase.position.y = 0.35;
rouletteGroup.add(tableBase);

const wheel = new THREE.Mesh(
  new THREE.CylinderGeometry(3.7, 3.7, 0.28, 72),
  new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.35, metalness: 0.22 })
);
wheel.position.y = 0.8;
rouletteGroup.add(wheel);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(3.62, 0.09, 16, 90),
  new THREE.MeshStandardMaterial({ color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 1.2, roughness: 0.2 })
);
rim.rotation.x = Math.PI/2;
rim.position.y = 0.95;
rouletteGroup.add(rim);

const roulLight = new THREE.PointLight(0x2bf7ff, 1.0, 20, 2);
roulLight.position.set(rouletteGroup.position.x, 3.0, rouletteGroup.position.z);
scene.add(roulLight);

// Physics rail
const rouletteCenter = new CANNON.Vec3(rouletteGroup.position.x, 0.95, rouletteGroup.position.z);
const railOuter = 3.38;
const railInner = 2.62;
const railHeight = 0.25;

function addWallSegment(radius, angle, length, thickness, y) {
  const shape = new CANNON.Box(new CANNON.Vec3(length/2, railHeight/2, thickness/2));
  const body = new CANNON.Body({ mass: 0, material: mat });
  body.addShape(shape);

  const x = rouletteCenter.x + Math.cos(angle) * radius;
  const z = rouletteCenter.z + Math.sin(angle) * radius;
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(0, -angle, 0); // tangent-ish
  world.addBody(body);
}

const SEG = 44;
for (let i = 0; i < SEG; i++) {
  const a = (i / SEG) * Math.PI * 2;
  addWallSegment(railOuter, a, 0.64, 0.14, 1.0);
  addWallSegment(railInner, a, 0.64, 0.14, 1.0);
}

function inwardForce(body) {
  const dx = body.position.x - rouletteCenter.x;
  const dz = body.position.z - rouletteCenter.z;
  const r = Math.sqrt(dx*dx + dz*dz) || 1;
  const target = (railOuter + railInner) * 0.5;
  const k = 6.2;
  const diff = r - target;
  body.applyForce(new CANNON.Vec3((-dx / r) * diff * k, 0, (-dz / r) * diff * k), body.position);
}

const ballRadius = 0.12;
const ballBody = new CANNON.Body({
  mass: 0.18,
  material: mat,
  linearDamping: 0.11,
  angularDamping: 0.25
});
ballBody.addShape(new CANNON.Sphere(ballRadius));
ballBody.position.set(rouletteCenter.x + railOuter - 0.25, 1.25, rouletteCenter.z);
world.addBody(ballBody);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(ballRadius, 18, 18),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.1 })
);
scene.add(ballMesh);

function spinRoulette() {
  ballBody.position.set(rouletteCenter.x + railOuter - 0.25, 1.25, rouletteCenter.z);
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);

  // Tangent push (along +Z from this spawn)
  ballBody.applyImpulse(new CANNON.Vec3(0.0, 0.18, 2.9), ballBody.position);

  playRoulette();
  playChip();
}

// ======================
// Slot Machine (glow + spin + win + coins)
// ======================
const slotGroup = new THREE.Group();
slotGroup.position.set(14, 0, -8);
scene.add(slotGroup);

const slotBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 3.4, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x14141f, roughness: 0.55, metalness: 0.25 })
);
slotBody.position.y = 1.7;
slotGroup.add(slotBody);

const screenMat = new THREE.MeshStandardMaterial({
  color: 0x101018,
  emissive: 0xff2bd6,
  emissiveIntensity: 0.85,
  roughness: 0.35
});
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), screenMat);
screen.position.set(0, 2.3, 0.76);
slotGroup.add(screen);

const trimMat = new THREE.MeshStandardMaterial({
  color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 0.95, roughness: 0.2
});
const trim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.075, 14, 60), trimMat);
trim.rotation.x = Math.PI/2;
trim.position.set(0, 2.3, 0.77);
slotGroup.add(trim);

const slotLight = new THREE.PointLight(0xff2bd6, 0.9, 20, 2);
slotLight.position.set(slotGroup.position.x, 3.2, slotGroup.position.z);
scene.add(slotLight);

const btnMat = new THREE.MeshStandardMaterial({ color: 0x0f0f14, emissive: 0xffd42b, emissiveIntensity: 0.25 });
const spinBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 22), btnMat);
spinBtn.rotation.x = Math.PI/2;
spinBtn.position.set(0.75, 1.05, 0.76);
slotGroup.add(spinBtn);

// Coins particles
const coins = [];
const coinGeo = new THREE.SphereGeometry(0.05, 10, 10);
const coinMat = new THREE.MeshStandardMaterial({
  color: 0xffd42b, emissive: 0xffd42b, emissiveIntensity: 0.9, roughness: 0.35
});
function spawnCoins() {
  for (let i = 0; i < 30; i++) {
    const m = new THREE.Mesh(coinGeo, coinMat);
    m.position.set(slotGroup.position.x, 2.1, slotGroup.position.z);
    m.userData.v = new THREE.Vector3(
      (Math.random() - 0.5) * 3.5,
      2.8 + Math.random() * 3.2,
      (Math.random() - 0.5) * 2.2
    );
    m.userData.life = 0.9 + Math.random() * 0.7;
    coins.push(m);
    scene.add(m);
  }
}

let slotSpinTimer = 0;
let slotWinTimer = 0;

function startSlotSpin() {
  if (slotSpinTimer > 0) return;
  slotSpinTimer = 1.25;
  playSlotSpin();
  playChip();
}
function triggerSlotWin() {
  slotWinTimer = 1.05;
  playWin();
  spawnCoins();
}

// ======================
// “Chip placement” (click floor)
// ======================
const chipTokens = [];
const chipTokenGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 18);
const chipTokenMat = new THREE.MeshStandardMaterial({ color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 0.2, roughness: 0.35 });
function dropChipAt(point) {
  const m = new THREE.Mesh(chipTokenGeo, chipTokenMat);
  m.position.set(point.x, 0.05, point.z);
  m.rotation.y = Math.random() * Math.PI * 2;
  chipTokens.push(m);
  scene.add(m);
  playChip();

  // keep it from growing forever
  if (chipTokens.length > 40) {
    const old = chipTokens.shift();
    scene.remove(old);
  }
}

// ======================
// Click interactions (raycast)
// ======================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

addEventListener("click", (e) => {
  // if overlay is still visible, this click is used to start the experience
  if (overlay && overlay.style.display !== "none") return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([wheel, spinBtn, floor], true);
  if (!hits.length) return;

  const hit = hits[0].object;

  if (hit === wheel) {
    spinRoulette();
    return;
  }

  if (hit === spinBtn) {
    startSlotSpin();
    return;
  }

  // floor chip placement
  if (hit === floor) {
    dropChipAt(hits[0].point);
  }
});

// ======================
// Render loop
// ======================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  const t = clock.elapsedTime;

  // animated vibe
  neonA.position.x = -12 + Math.sin(t * 0.8) * 2.4;
  neonB.position.x =  12 + Math.sin(t * 0.8 + 1.7) * 2.4;
  sign.material.emissiveIntensity = 1.1 + Math.sin(t * 6.0) * 0.35;
  signLight.intensity = 1.2 + Math.sin(t * 6.0) * 0.5;

  // roulette visuals
  wheel.rotation.y += dt * 0.75;
  rim.material.emissiveIntensity = 1.0 + Math.sin(t * 5.5) * 0.25;

  // slot idle pulse
  const idlePulse = 0.65 + Math.sin(t * 5.0) * 0.25;
  screenMat.emissiveIntensity = idlePulse;
  slotLight.intensity = 0.6 + Math.sin(t * 4.0 + 1.2) * 0.25;

  // slot spin animation
  if (slotSpinTimer > 0) {
    slotSpinTimer -= dt;

    const spinPulse = 1.1 + Math.sin(t * 28.0) * 0.6;
    screenMat.emissiveIntensity = spinPulse;
    trimMat.emissiveIntensity = 1.1 + Math.sin(t * 22.0) * 0.45;

    slotGroup.position.x = 14 + Math.sin(t * 60.0) * 0.02;
    slotGroup.position.z = -8 + Math.cos(t * 55.0) * 0.02;

    // end of spin -> maybe win
    if (slotSpinTimer <= 0) {
      slotGroup.position.set(14, 0, -8);
      if (Math.random() < 0.55) triggerSlotWin();
    }
  }

  // slot win flash
  if (slotWinTimer > 0) {
    slotWinTimer -= dt;

    const flash = 2.1 + Math.sin(t * 40.0) * 0.9;
    screenMat.emissiveIntensity = flash;
    trimMat.emissiveIntensity = 1.9 + Math.sin(t * 24.0) * 0.7;
    slotLight.intensity = 2.0;
    btnMat.emissiveIntensity = 1.6;

    const s = 1.0 + 0.08 * Math.sin((1.05 - slotWinTimer) * 16.0);
    slotGroup.scale.set(s, s, s);

    if (slotWinTimer <= 0) {
      slotLight.intensity = 0.9;
      btnMat.emissiveIntensity = 0.25;
      slotGroup.scale.set(1, 1, 1);
    }
  }

  // physics step
  world.step(1/60, dt, 3);
  inwardForce(ballBody);
  ballMesh.position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);

  // coins update
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.userData.life -= dt;
    c.userData.v.y -= 6.5 * dt;
    c.position.addScaledVector(c.userData.v, dt);
    c.rotation.x += dt * 6;
    c.rotation.y += dt * 8;

    if (c.userData.life <= 0 || c.position.y < 0.05) {
      scene.remove(c);
      coins.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

animate();

// Resize
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
