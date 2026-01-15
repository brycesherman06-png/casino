// ======================
// PIXEL CASINO (ONE LONG FILE — UPDATED)
// Goals:
// - Crisp pixelated 3D (no fuzz)
// - Classic casino ROOM (not a void) + better coloring/detail via pixel textures
// - Smooth layout (clear zones)
// - Games MORE playable: Slots + Roulette betting + Blackjack (UI overlays)
// - Clear visuals: each game reads instantly (shapes + colors + icons)
// - Floating nametags above each game (pixel-styled)
// - WASD + mouse look (higher sens, not crazy)
// - Howler sounds with NO audio files (generated)
// ======================

console.log("Pixel Casino main.js (updated) loaded ✅");

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
      font:900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      user-select:none;
    }
    .uiWrap{
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.55); z-index:9998; backdrop-filter: blur(6px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:#fff;
    }
    .uiCard{
      width:min(620px, 92vw);
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
    .uiTitle{ font-weight:1000; letter-spacing:.6px; }
    .uiClose{
      cursor:pointer; border:0; background:rgba(255,255,255,.08);
      color:#fff; padding:8px 10px; border-radius:10px;
      font-weight:900;
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
      font-weight:950;
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
      font:900 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      max-width: 640px;
      line-height: 1.25;
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
  <div><b>Click a game</b> to open its UI: <span style="color:#2bf7ff">Roulette</span> • <span style="color:#ff2bd6">Slots</span> • <span style="color:#ffd42b">Blackjack</span></div>
  <div>Tip: Adjust pixelation in code via <b>PIXEL_SCALE</b> (2 = best “Pixel Gun” vibe)</div>
`;
document.body.appendChild(hint);

// ======================
// HOWLER — generated sounds (NO files)
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
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
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
  ambience: new Howl({ src: [makeNoiseLoop(1.35, 0.22)], loop: true, volume: 0.26 }),
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
// THREE — renderer + crisp pixel pipeline
// ======================
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
// Keep tone mapping mild to avoid “smear”
renderer.toneMapping = THREE.NoToneMapping;
renderer.physicallyCorrectLights = true;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0711);
// IMPORTANT: no fog (fog makes pixel look fuzzy)
scene.fog = null;

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 350);
camera.rotation.order = "YXZ";

// ===== PIXEL SCALE knob =====
// 2 = best “Pixel Gun 3D” vibe (crisp), 3 = chunkier
let PIXEL_SCALE = 2;

const lowRes = { rt: null, w: 0, h: 0 };
const blitScene = new THREE.Scene();
const blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blitMat = new THREE.MeshBasicMaterial({ map: null });
blitMat.toneMapped = false; // CRITICAL: prevents tonemapping blur
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
  lowRes.rt.texture.minFilter = THREE.NearestFilter;
  lowRes.rt.texture.magFilter = THREE.NearestFilter;
  lowRes.rt.texture.generateMipmaps = false;

  blitMat.map = lowRes.rt.texture;
  blitMat.needsUpdate = true;
}
rebuildLowResTarget();

// ======================
// Pixel textures (CanvasTexture with NearestFilter)
// ======================
function makePixelTexture(drawFn, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  drawFn(g, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ======================
// Lighting — classic casino (warm + neon accents)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.06));
scene.add(new THREE.HemisphereLight(0xaec7ff, 0x120014, 0.14));

const spotKey = new THREE.SpotLight(0xfff2d2, 820, 220, Math.PI / 5.5, 0.45, 1.1);
spotKey.position.set(0, 22, 8);
spotKey.target.position.set(0, 0, 0);
spotKey.castShadow = true;
spotKey.shadow.mapSize.set(2048, 2048);
scene.add(spotKey);
scene.add(spotKey.target);

const neonA = new THREE.PointLight(0xff2bd6, 140, 80, 2);
neonA.position.set(-22, 8, 18);
scene.add(neonA);

const neonB = new THREE.PointLight(0x2bf7ff, 140, 80, 2);
neonB.position.set(22, 8, -18);
scene.add(neonB);

const neonC = new THREE.PointLight(0xffd42b, 95, 60, 2);
neonC.position.set(0, 9, -34);
scene.add(neonC);

// ======================
// ROOM — better detail (walls + carpet + ceiling)
// ======================
const ROOM_W = 120;
const ROOM_D = 120;
const ROOM_H = 22;

const wallTex = makePixelTexture((g, s) => {
  g.fillStyle = "#141018";
  g.fillRect(0, 0, s, s);

  // panel grid
  for (let y = 0; y < s; y += 16) {
    for (let x = 0; x < s; x += 16) {
      g.fillStyle = ((x + y) % 32 === 0) ? "#241c33" : "#1e1830";
      g.fillRect(x + 1, y + 1, 14, 14);
      // small highlight
      g.fillStyle = "rgba(255,255,255,0.07)";
      g.fillRect(x + 2, y + 2, 6, 1);
    }
  }

  // gold trim lines
  g.fillStyle = "#b58a2a";
  for (let i = 0; i < s; i += 8) g.fillRect(i, 0, 1, s);
}, 64);
wallTex.repeat.set(7, 2);

const roomBox = new THREE.Mesh(
  new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D),
  new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.94,
    metalness: 0.02,
    side: THREE.BackSide
  })
);
roomBox.position.y = ROOM_H / 2;
roomBox.receiveShadow = true;
scene.add(roomBox);

// ceiling “tiles”
const ceilingTex = makePixelTexture((g, s) => {
  g.fillStyle = "#1b1622";
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 8) {
    for (let x = 0; x < s; x += 8) {
      g.fillStyle = ((x + y) % 16 === 0) ? "#231c2c" : "#1a1424";
      g.fillRect(x, y, 8, 8);
    }
  }
  // subtle light strips
  g.fillStyle = "rgba(255,242,210,0.10)";
  for (let i = 0; i < s; i += 16) g.fillRect(0, i, s, 1);
}, 64);
ceilingTex.repeat.set(8, 8);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W - 2, ROOM_D - 2),
  new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.95, metalness: 0 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, ROOM_H - 0.25, 0);
scene.add(ceiling);

// carpet (real casino pattern)
const carpetTex = makePixelTexture((g, s) => {
  g.fillStyle = "#240b2c";
  g.fillRect(0, 0, s, s);

  for (let y = 0; y < s; y += 8) {
    for (let x = 0; x < s; x += 8) {
      const on = ((x / 8 + y / 8) % 2) === 0;
      g.fillStyle = on ? "#3b0f49" : "#1a0820";
      g.fillRect(x, y, 8, 8);

      // sparkle
      g.fillStyle = "rgba(255, 212, 43, 0.14)";
      g.fillRect(x + 3, y + 3, 2, 2);
    }
  }

  // swirls
  g.fillStyle = "rgba(43, 247, 255, 0.10)";
  for (let i = 0; i < s; i += 16) {
    g.fillRect(i + 2, 0, 1, s);
    g.fillRect(0, i + 6, s, 1);
  }
}, 64);
carpetTex.repeat.set(12, 12);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W - 6, ROOM_D - 6),
  new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.98, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Columns (help “room” feel real)
const colTex = makePixelTexture((g, s) => {
  g.fillStyle = "#2a2633";
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 4) {
    g.fillStyle = (y % 8 === 0) ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
    g.fillRect(0, y, s, 1);
  }
  g.fillStyle = "#b58a2a";
  g.fillRect(0, 0, s, 2);
  g.fillRect(0, s - 2, s, 2);
}, 64);
colTex.repeat.set(1, 2);

const colMat = new THREE.MeshStandardMaterial({ map: colTex, roughness: 0.9, metalness: 0.05 });

function addColumn(x, z) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, ROOM_H - 2, 10), colMat);
  c.position.set(x, (ROOM_H - 2) / 2 + 1, z);
  c.castShadow = c.receiveShadow = true;
  scene.add(c);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.10, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 1.0, roughness: 0.25 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, ROOM_H - 3.0, z);
  scene.add(ring);

  const pl = new THREE.PointLight(0xff2bd6, 55, 16, 2);
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

// Ceiling fixtures (visible)
const lampMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.7, metalness: 0.2 });
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c6, emissiveIntensity: 1.25, roughness: 0.25 });

function addCeilingLight(x, z) {
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.25, 10), lampMat);
  fixture.position.set(x, ROOM_H - 1.0, z);
  scene.add(fixture);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), bulbMat);
  bulb.position.set(x, ROOM_H - 1.35, z);
  scene.add(bulb);

  const l = new THREE.PointLight(0xfff2c6, 135, 26, 2);
  l.position.set(x, ROOM_H - 1.35, z);
  scene.add(l);
}
for (let x = -24; x <= 24; x += 12) {
  for (let z = -24; z <= 24; z += 12) addCeilingLight(x, z);
}

// Back wall neon sign
const signTex = makePixelTexture((g, s) => {
  g.fillStyle = "#0d0d14";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#ff2bd6";
  g.fillRect(6, 18, s - 12, 10);
  g.fillStyle = "#2bf7ff";
  g.fillRect(10, 34, s - 20, 8);
  g.fillStyle = "rgba(255,212,43,0.9)";
  g.fillRect(12, 48, s - 24, 6);
}, 64);

const sign = new THREE.Mesh(
  new THREE.BoxGeometry(16, 3.4, 0.5),
  new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xff2bd6, emissiveIntensity: 0.55, roughness: 0.4 })
);
sign.position.set(0, 7.2, -ROOM_D / 2 + 1.0);
sign.castShadow = true;
scene.add(sign);

const signLight = new THREE.PointLight(0xff2bd6, 135, 45, 2);
signLight.position.set(0, 7.2, -ROOM_D / 2 + 3.0);
scene.add(signLight);

// ======================
// Name tags (Sprites) — pixel styled labels above games
// ======================
function makeLabelSprite(text, fg = "#ffffff", bg = "rgba(0,0,0,0.65)", accent = "#2bf7ff") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  // background
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  // accent border
  g.fillStyle = accent;
  g.fillRect(0, 0, c.width, 4);
  g.fillRect(0, c.height - 4, c.width, 4);
  g.fillRect(0, 0, 4, c.height);
  g.fillRect(c.width - 4, 0, 4, c.height);

  // inner border
  g.fillStyle = "rgba(255,255,255,0.12)";
  g.fillRect(6, 6, c.width - 12, 2);

  // text
  g.fillStyle = fg;
  g.font = "900 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(9.5, 2.4, 1);
  return spr;
}

function addLabelAbove(obj3d, text, accent) {
  const spr = makeLabelSprite(text, "#ffffff", "rgba(0,0,0,0.62)", accent);
  spr.position.set(0, 6.2, 0);
  obj3d.add(spr);
  return spr;
}

// ======================
// Smooth layout plan (readable zones)
// - Center aisle (spawn)
// - Left zone: Roulette (iconic wheel + ring)
// - Right zone: Slots row (big screens + symbols)
// - Back zone: Blackjack table (felt markings)
// ======================
const LAYOUT = {
  spawn: new THREE.Vector3(0, 1.75, 32),
  roulette: new THREE.Vector3(-28, 0, 0),
  slotsRowZ: 0,
  slotsStartX: 8,
  slotsCount: 7,
  slotsSpacing: 4.0,
  blackjack: new THREE.Vector3(0, 0, -30)
};

// Decorative aisle runner (helps navigation)
const aisleTex = makePixelTexture((g, s) => {
  g.fillStyle = "#0f0a16";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "rgba(43,247,255,0.25)";
  for (let y = 0; y < s; y += 8) g.fillRect(s/2 - 1, y, 2, 4);
  g.fillStyle = "rgba(255,43,214,0.18)";
  g.fillRect(2, 2, s - 4, 2);
  g.fillRect(2, s - 4, s - 4, 2);
}, 64);
aisleTex.repeat.set(2, 16);

const aisle = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 96),
  new THREE.MeshStandardMaterial({ map: aisleTex, roughness: 0.98, metalness: 0 })
);
aisle.rotation.x = -Math.PI / 2;
aisle.position.set(0, 0.005, 0);
aisle.receiveShadow = true;
scene.add(aisle);

// ======================
// Player + Controls (WASD + mouse look)
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

// Higher sensitivity, not crazy
const MOUSE_SENS = 0.0036;

document.addEventListener("mousemove", (e) => {
  if (!locked) return;
  yaw   -= e.movementX * MOUSE_SENS;
  pitch -= e.movementY * MOUSE_SENS;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  camera.rotation.set(pitch, yaw, 0);
});

const player = {
  pos: LAYOUT.spawn.clone(),
  vel: new THREE.Vector3(0, 0, 0),
  eye: 1.75,
  walk: 4.8,
  sprint: 7.6,
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
// Economy (shared balance) + HUD (small in-corner)
// ======================
const Economy = {
  balance: 1000,
  clampBet(b) { return Math.max(10, Math.min(500, b|0)); },
  canBet(b) { return this.balance >= b; },
  bet(b) { this.balance -= b; },
  pay(x) { this.balance += x; }
};

const hud = document.createElement("div");
hud.className = "hint";
hud.style.left = "auto";
hud.style.right = "14px";
hud.style.maxWidth = "240px";
hud.innerHTML = `<div><b>BALANCE</b></div><div id="hudBal">$1000</div>`;
document.body.appendChild(hud);
const hudBal = document.getElementById("hudBal");
function updateHUD() { hudBal.textContent = `$${Economy.balance}`; }
updateHUD();

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
// ROULETTE — clearer visuals + UI betting
// ======================
const rouletteGroup = new THREE.Group();
rouletteGroup.position.copy(LAYOUT.roulette);
scene.add(rouletteGroup);

// Table base (wood)
const woodTex = makePixelTexture((g, s) => {
  g.fillStyle = "#3a2416";
  g.fillRect(0,0,s,s);
  for (let y=0; y<s; y+=2){
    const c = (y%4===0) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.05)";
    g.fillStyle = c;
    g.fillRect(0,y,s,1);
  }
  g.fillStyle = "rgba(181,138,42,0.6)";
  g.fillRect(0, 2, s, 2);
  g.fillRect(0, s-4, s, 2);
}, 64);
woodTex.repeat.set(2, 2);

const rouletteBase = new THREE.Mesh(
  new THREE.CylinderGeometry(5.3, 5.6, 0.9, 24),
  new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9, metalness: 0.04 })
);
rouletteBase.position.y = 0.45;
rouletteBase.castShadow = rouletteBase.receiveShadow = true;
rouletteGroup.add(rouletteBase);

// Wheel top texture (readable red/black/green wedges)
const wheelTex = makePixelTexture((g, s) => {
  g.fillStyle = "#101018";
  g.fillRect(0,0,s,s);

  const cx = s/2, cy = s/2;
  const wedges = 12;
  for (let i=0; i<wedges; i++){
    const a0 = (i / wedges) * Math.PI*2;
    const a1 = ((i+1) / wedges) * Math.PI*2;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, s*0.45, a0, a1);
    g.closePath();
    if (i === 0) g.fillStyle = "#1aa85b";         // green
    else g.fillStyle = (i%2===0) ? "#d12b2b" : "#1b1b1b"; // red/black
    g.fill();

    // number tick
    g.fillStyle = "rgba(255,255,255,0.8)";
    const mid = (a0+a1)/2;
    const tx = cx + Math.cos(mid)*s*0.34;
    const ty = cy + Math.sin(mid)*s*0.34;
    g.fillRect(tx|0, ty|0, 2, 2);
  }

  // center hub
  g.fillStyle = "#2bf7ff";
  g.fillRect(cx-2, cy-2, 4, 4);
}, 128);

const rouletteWheel = new THREE.Mesh(
  new THREE.CylinderGeometry(4.1, 4.1, 0.34, 28),
  new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.4, metalness: 0.15 })
);
rouletteWheel.position.y = 1.05;
rouletteWheel.castShadow = rouletteWheel.receiveShadow = true;
rouletteGroup.add(rouletteWheel);

const rouletteRim = new THREE.Mesh(
  new THREE.TorusGeometry(4.0, 0.12, 10, 20),
  new THREE.MeshStandardMaterial({ color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 0.9, roughness: 0.25 })
);
rouletteRim.rotation.x = Math.PI/2;
rouletteRim.position.y = 1.25;
rouletteGroup.add(rouletteRim);

const roulLight = new THREE.PointLight(0x2bf7ff, 90, 26, 2);
roulLight.position.set(rouletteGroup.position.x, 3.5, rouletteGroup.position.z);
scene.add(roulLight);

// Add label
addLabelAbove(rouletteGroup, "ROULETTE", "#2bf7ff");

// Rail physics
const rouletteCenter = new CANNON.Vec3(rouletteGroup.position.x, 1.25, rouletteGroup.position.z);
const railOuter = 3.7;
const railInner = 2.9;
const railHeight = 0.28;

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
  addRailSegment(railOuter, a, 0.7, 0.14, 1.30);
  addRailSegment(railInner, a, 0.7, 0.14, 1.30);
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
ballBody.position.set(rouletteCenter.x + railOuter - 0.28, 1.50, rouletteCenter.z);
world.addBody(ballBody);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(ballRadius, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.1 })
);
ballMesh.castShadow = true;
scene.add(ballMesh);

// Roulette “result” model (simple 12 wedges)
const WEDGES = 12; // simplified readable roulette
const wedgeColors = [];
for (let i=0;i<WEDGES;i++){
  if (i===0) wedgeColors.push("green");
  else wedgeColors.push(i%2===0 ? "red" : "black");
}
function rouletteResultFromWheelAngle(angle) {
  // map angle to wedge index
  // angle is radians; normalize 0..2pi
  let a = angle % (Math.PI*2);
  if (a < 0) a += Math.PI*2;
  const idx = Math.floor((a / (Math.PI*2)) * WEDGES) % WEDGES;
  return idx;
}

function spinRoulettePhysics() {
  ballBody.position.set(rouletteCenter.x + railOuter - 0.28, 1.50, rouletteCenter.z);
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);
  ballBody.applyImpulse(new CANNON.Vec3(0.0, 0.20, 3.2), ballBody.position);
  playRoulette();
  playChip();
}

// ======================
// SLOTS — clearer machines + UI (playable)
// ======================
const slots = [];
const coinParticles = [];

const coinGeo = new THREE.SphereGeometry(0.06, 8, 8);
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

const slotBodyTex = makePixelTexture((g,s)=>{
  g.fillStyle="#13131c"; g.fillRect(0,0,s,s);
  for (let y=0;y<s;y+=8){
    g.fillStyle = (y%16===0) ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.10)";
    g.fillRect(0,y,s,1);
  }
  // neon edge blocks
  g.fillStyle="#2bf7ff"; g.fillRect(0,0,4,s);
  g.fillStyle="#ff2bd6"; g.fillRect(s-4,0,4,s);
},64);
slotBodyTex.repeat.set(1,1);

function makeSlotScreenTexture(symbolsText="🍒 🔔 7️⃣") {
  return makePixelTexture((g, s) => {
    g.fillStyle = "#0b0b12";
    g.fillRect(0,0,s,s);

    // frame
    g.fillStyle = "rgba(43,247,255,0.35)";
    g.fillRect(0, 0, s, 3);
    g.fillRect(0, s-3, s, 3);

    // slots reels blocks
    const w = Math.floor(s/3);
    for (let i=0;i<3;i++){
      g.fillStyle = (i%2===0) ? "#1a1024" : "#140c1c";
      g.fillRect(i*w+2, 14, w-4, s-28);
      g.fillStyle="rgba(255,255,255,0.08)";
      g.fillRect(i*w+4, 16, w-8, 2);
    }

    // big text (emoji)
    g.fillStyle = "#ffffff";
    g.font = "900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(symbolsText, s/2, s/2);
  }, 64);
}

function createSlotMachine(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 3.6, 1.8),
    new THREE.MeshStandardMaterial({ map: slotBodyTex, roughness: 0.6, metalness: 0.15 })
  );
  body.position.y = 1.8;
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  const screenTex = makeSlotScreenTexture("🍒 🔔 7️⃣");
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0xff2bd6,
    emissiveIntensity: 0.30,
    roughness: 0.4
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), screenMat);
  screen.position.set(0, 2.45, 0.92);
  g.add(screen);

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2bf7ff,
    emissive: 0x2bf7ff,
    emissiveIntensity: 0.8,
    roughness: 0.25
  });
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 10, 18), trimMat);
  trim.rotation.x = Math.PI/2;
  trim.position.set(0, 2.45, 0.93);
  g.add(trim);

  const btnMat = new THREE.MeshStandardMaterial({ color: 0x0f0f14, emissive: 0xffd42b, emissiveIntensity: 0.20, roughness: 0.45 });
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.10, 14), btnMat);
  btn.rotation.x = Math.PI/2;
  btn.position.set(0.95, 1.15, 0.92);
  g.add(btn);

  const glow = new THREE.PointLight(0xff2bd6, 85, 20, 2);
  glow.position.set(x, 3.4, z);
  scene.add(glow);

  // label on the whole row (only one label for row; we’ll add later)
  return {
    group: g,
    button: btn,
    screenMat,
    trimMat,
    btnMat,
    glow,
    screenTex,
    spinT: 0,
    winT: 0
  };
}

// Slot row layout
const slotRowGroup = new THREE.Group();
slotRowGroup.position.set(0, 0, LAYOUT.slotsRowZ);
scene.add(slotRowGroup);

for (let i = 0; i < LAYOUT.slotsCount; i++) {
  const x = LAYOUT.slotsStartX + i * LAYOUT.slotsSpacing;
  const s = createSlotMachine(x, 0);
  slotRowGroup.add(s.group);
  slots.push(s);
}
// Put the row on the RIGHT side
slotRowGroup.position.x = 10;
slotRowGroup.position.z = 0;
slotRowGroup.rotation.y = -0.10;
addLabelAbove(slotRowGroup, "SLOTS", "#ff2bd6");

// Slots UI (playable)
const slotUI = document.createElement("div");
slotUI.className = "uiWrap";
slotUI.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">SLOTS</div>
      <button class="uiClose" id="slotClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="slotBal">$0</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="slotBet">$25</div></div>
        <div class="pill"><div><b>Payout</b></div><div id="slotPay">—</div></div>
      </div>

      <div class="pill" style="margin-top:12px; font-size:26px; letter-spacing:2px;">
        <div><b>Reels</b></div>
        <div id="slotReels">— — —</div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="slotDown">Bet -</button>
        <button class="btn" id="slotUp">Bet +</button>
        <button class="btn btnPrimary" id="slotSpin">SPIN</button>
      </div>

      <div class="msg" id="slotMsg">Click a slot machine to play.</div>
      <div class="msg" style="opacity:.8;">
        3-match pays big • 2-match pays half • Symbols: 🍒 🔔 🍋 💎 7️⃣
      </div>
    </div>
  </div>
`;
document.body.appendChild(slotUI);

let slotState = { open:false, bet:25, activeSlot:null, spinning:false };
const slotSymbols = ["🍒","🔔","🍋","💎","7️⃣"];
const slotPayout = { "🍒": 2, "🔔": 4, "🍋": 3, "💎": 8, "7️⃣": 15 };

function slotOpen(slotObj){
  slotState.open = true;
  slotState.activeSlot = slotObj;
  slotState.spinning = false;
  slotUI.style.display = "flex";
  slotRefresh("Ready. Set bet and SPIN.");
}
function slotClose(){
  slotState.open = false;
  slotState.activeSlot = null;
  slotState.spinning = false;
  slotUI.style.display = "none";
}
document.getElementById("slotClose").onclick = slotClose;

function slotRefresh(msg){
  document.getElementById("slotBal").textContent = `$${Economy.balance}`;
  document.getElementById("slotBet").textContent = `$${slotState.bet}`;
  if (msg) document.getElementById("slotMsg").textContent = msg;
  updateHUD();
}

document.getElementById("slotUp").onclick = () => {
  if (slotState.spinning) return;
  slotState.bet = Economy.clampBet(slotState.bet + 10);
  playChip();
  slotRefresh();
};
document.getElementById("slotDown").onclick = () => {
  if (slotState.spinning) return;
  slotState.bet = Economy.clampBet(slotState.bet - 10);
  playChip();
  slotRefresh();
};

function setSlotScreen(slotObj, symbolsArr) {
  const txt = symbolsArr.join(" ");
  // rebuild texture for crisp pixel text
  const tex = makeSlotScreenTexture(txt);
  slotObj.screenTex.dispose?.();
  slotObj.screenTex = tex;
  slotObj.screenMat.map = tex;
  slotObj.screenMat.needsUpdate = true;
}

document.getElementById("slotSpin").onclick = () => {
  if (!slotState.activeSlot) return slotRefresh("Click a machine first.");
  if (slotState.spinning) return;

  const b = slotState.bet;
  if (!Economy.canBet(b)) return slotRefresh("Not enough balance.");
  Economy.bet(b);
  updateHUD();
  playSlotSpin();
  playChip();

  slotState.spinning = true;

  // “spin animation” (fake reel updates)
  let ticks = 14;
  const rollTimer = setInterval(() => {
    const temp = [
      slotSymbols[(Math.random()*slotSymbols.length)|0],
      slotSymbols[(Math.random()*slotSymbols.length)|0],
      slotSymbols[(Math.random()*slotSymbols.length)|0]
    ];
    document.getElementById("slotReels").textContent = temp.join(" ");
    setSlotScreen(slotState.activeSlot, temp);

    // glow while spinning
    slotState.activeSlot.screenMat.emissiveIntensity = 0.55;
    slotState.activeSlot.trimMat.emissiveIntensity = 1.2;
    slotState.activeSlot.glow.intensity = 130;

    ticks--;
    if (ticks <= 0) {
      clearInterval(rollTimer);

      const r = [
        slotSymbols[(Math.random()*slotSymbols.length)|0],
        slotSymbols[(Math.random()*slotSymbols.length)|0],
        slotSymbols[(Math.random()*slotSymbols.length)|0]
      ];
      document.getElementById("slotReels").textContent = r.join(" ");
      setSlotScreen(slotState.activeSlot, r);

      let win = 0;
      let payText = "—";
      if (r[0] === r[1] && r[1] === r[2]) {
        win = b * slotPayout[r[0]];
        payText = `${slotPayout[r[0]]}x`;
      } else if (r[0] === r[1] || r[1] === r[2]) {
        const sym = r[1];
        win = Math.floor(b * (slotPayout[sym] / 2));
        payText = `${(slotPayout[sym]/2).toFixed(1)}x`;
      }

      document.getElementById("slotPay").textContent = payText;

      if (win > 0) {
        Economy.pay(win);
        playWin();
        const p = slotState.activeSlot.group.getWorldPosition(new THREE.Vector3());
        spawnCoins(p.x, 2.2, p.z);
        slotState.activeSlot.winT = 1.0;
        slotRefresh(`WIN! +$${win}`);
      } else {
        slotRefresh("No win. Spin again.");
      }

      // settle visuals
      slotState.activeSlot.screenMat.emissiveIntensity = 0.30;
      slotState.activeSlot.trimMat.emissiveIntensity = 0.85;
      slotState.activeSlot.glow.intensity = 85;

      slotState.spinning = false;
    }
  }, 70);
};

// ======================
// BLACKJACK — clearer table markings + playable UI
// ======================
const bjTex = makePixelTexture((g, s) => {
  g.fillStyle = "#0e6b3a";
  g.fillRect(0,0,s,s);

  // “felt” speckle
  g.fillStyle = "rgba(0,0,0,0.12)";
  for (let i=0;i<220;i++){
    g.fillRect((Math.random()*s)|0, (Math.random()*s)|0, 1, 1);
  }

  // betting arc + boxes
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(s/2, s*0.65, s*0.32, Math.PI*1.05, Math.PI*1.95);
  g.stroke();

  g.fillStyle = "rgba(0,0,0,0.20)";
  for (let i=0;i<3;i++){
    g.fillRect(12 + i*18, 10, 14, 10);
    g.fillRect(s-26 - i*18, 10, 14, 10);
  }

  // label
  g.fillStyle = "rgba(255,212,43,0.85)";
  g.fillRect(10, s-18, s-20, 6);
}, 64);

const blackjackGroup = new THREE.Group();
blackjackGroup.position.copy(LAYOUT.blackjack);
scene.add(blackjackGroup);

const bjTable = new THREE.Mesh(
  new THREE.CylinderGeometry(3.4, 3.4, 0.45, 20),
  new THREE.MeshStandardMaterial({ map: bjTex, roughness: 0.75, emissive: 0x001a08, emissiveIntensity: 0.20 })
);
bjTable.position.set(0, 1.05, 0);
bjTable.castShadow = bjTable.receiveShadow = true;
blackjackGroup.add(bjTable);

const bjBase = new THREE.Mesh(
  new THREE.CylinderGeometry(3.8, 4.1, 0.65, 20),
  new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9, metalness: 0.04 })
);
bjBase.position.set(0, 0.35, 0);
bjBase.castShadow = bjBase.receiveShadow = true;
blackjackGroup.add(bjBase);

const bjLight = new THREE.PointLight(0xffd42b, 120, 18, 2);
bjLight.position.set(blackjackGroup.position.x, 3.4, blackjackGroup.position.z);
scene.add(bjLight);

addLabelAbove(blackjackGroup, "BLACKJACK", "#ffd42b");

// Blackjack UI (playable)
const bjUI = document.createElement("div");
bjUI.className = "uiWrap";
bjUI.innerHTML = `
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
        <div class="pill" style="flex:1; min-width:260px;">
          <div><b>Your Hand</b></div>
          <div id="bjPlayerHand">—</div>
          <div id="bjPlayerScore" style="opacity:.9; margin-top:4px;">Score: —</div>
        </div>
        <div class="pill" style="flex:1; min-width:260px;">
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
document.body.appendChild(bjUI);

const $ = (id) => document.getElementById(id);

let bj = {
  open: false,
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
  for (const s of suits) for (const r of ranks) deck.push({
    r, s, label: `${r}${s}`,
    value: (r === "A") ? 11 : (["K","Q","J"].includes(r) ? 10 : Number(r))
  });
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
  $("bjBalance").textContent = `$${Economy.balance}`;
  $("bjBet").textContent = `$${bj.bet}`;
  $("bjStatus").textContent = bj.phase.toUpperCase();

  $("bjPlayerHand").textContent = bj.player.map(c => c.label).join(" ");
  $("bjDealerHand").textContent = bj.dealer.map((c, i) => {
    if (bj.phase === "player" && i === 1) return "🂠";
    return c.label;
  }).join(" ");

  const pScore = bjScore(bj.player);
  const dScore = (bj.phase === "player") ? bjScore([bj.dealer[0]]) : bjScore(bj.dealer);
  $("bjPlayerScore").textContent = `Score: ${bj.player.length ? pScore : "—"}`;
  $("bjDealerScore").textContent = `Score: ${bj.dealer.length ? dScore : "—"}`;

  if (msg) $("bjMsg").textContent = msg;
  updateHUD();
}
function bjOpen() {
  bj.open = true;
  bjUI.style.display = "flex";
  bjUpdateUI("Ready. Adjust bet or Deal.");
}
function bjClose() {
  bj.open = false;
  bjUI.style.display = "none";
}
$("bjClose").onclick = bjClose;

$("bjBetUp").onclick = () => {
  if (bj.phase !== "ready") return;
  bj.bet = Economy.clampBet(bj.bet + 25);
  playChip();
  bjUpdateUI();
};
$("bjBetDown").onclick = () => {
  if (bj.phase !== "ready") return;
  bj.bet = Economy.clampBet(bj.bet - 25);
  playChip();
  bjUpdateUI();
};

$("bjDeal").onclick = () => {
  if (bj.phase !== "ready") return;
  if (!Economy.canBet(bj.bet)) return bjUpdateUI("Not enough balance.");
  Economy.bet(bj.bet);
  playChip();

  bj.deck = bjMakeDeck();
  bj.player = [bj.deck.pop(), bj.deck.pop()];
  bj.dealer = [bj.deck.pop(), bj.deck.pop()];
  bj.phase = "player";

  const p = bjScore(bj.player);
  if (p === 21) {
    // blackjack payout: 3:2 (profit = 1.5x bet)
    const win = Math.floor(bj.bet * 2.5);
    Economy.pay(win);
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
    Economy.pay(bj.bet * 2);
    playWin();
    bjUpdateUI(`You win! Dealer: ${d}. (+$${bj.bet})`);
  } else if (p === d) {
    Economy.pay(bj.bet);
    bjUpdateUI(`Push. Dealer: ${d}. (Bet returned)`);
  } else {
    bjUpdateUI(`Dealer wins. Dealer: ${d}.`);
  }
  bj.phase = "ready";
};

// ======================
// ROULETTE UI (playable) — bet type + payout
// ======================
const rouletteUI = document.createElement("div");
rouletteUI.className = "uiWrap";
rouletteUI.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">ROULETTE</div>
      <button class="uiClose" id="roulClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="roulBal">$0</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="roulBet">$25</div></div>
        <div class="pill"><div><b>Bet Type</b></div><div id="roulType">RED</div></div>
      </div>

      <div class="uiRow" style="margin-top:12px;">
        <div class="pill" style="flex:1; min-width:240px;">
          <div><b>Last Result</b></div>
          <div id="roulResult">—</div>
        </div>
        <div class="pill" style="flex:1; min-width:240px;">
          <div><b>Payout</b></div>
          <div id="roulPayout">2x (RED/BLACK)</div>
        </div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="roulDown">Bet -</button>
        <button class="btn" id="roulUp">Bet +</button>
        <button class="btn" id="roulTypeBtn">Change Bet Type</button>
        <button class="btn btnPrimary" id="roulSpin">SPIN</button>
      </div>

      <div class="msg" id="roulMsg">Click the roulette wheel to play.</div>
      <div class="msg" style="opacity:.85;">
        Bet types: RED • BLACK • GREEN(0) • NUMBER(choose 0-11)
      </div>
    </div>
  </div>
`;
document.body.appendChild(rouletteUI);

let rouletteState = {
  open: false,
  bet: 25,
  typeIndex: 0,
  types: ["RED", "BLACK", "GREEN", "NUMBER"],
  numberPick: 7,
  spinning: false,
  last: "—"
};

function rouletteTypeText() {
  const t = rouletteState.types[rouletteState.typeIndex];
  if (t === "NUMBER") return `NUMBER (${rouletteState.numberPick})`;
  return t;
}
function roulettePayoutText() {
  const t = rouletteState.types[rouletteState.typeIndex];
  if (t === "GREEN") return "12x (GREEN 0)";
  if (t === "NUMBER") return "12x (Exact)";
  return "2x (RED/BLACK)";
}

function rouletteRefresh(msg) {
  document.getElementById("roulBal").textContent = `$${Economy.balance}`;
  document.getElementById("roulBet").textContent = `$${rouletteState.bet}`;
  document.getElementById("roulType").textContent = rouletteTypeText();
  document.getElementById("roulPayout").textContent = roulettePayoutText();
  document.getElementById("roulResult").textContent = rouletteState.last;
  if (msg) document.getElementById("roulMsg").textContent = msg;
  updateHUD();
}

function rouletteOpen() {
  rouletteState.open = true;
  rouletteState.spinning = false;
  rouletteUI.style.display = "flex";
  rouletteRefresh("Pick bet type and SPIN.");
}
function rouletteClose() {
  rouletteState.open = false;
  rouletteState.spinning = false;
  rouletteUI.style.display = "none";
}
document.getElementById("roulClose").onclick = rouletteClose;

document.getElementById("roulUp").onclick = () => {
  if (rouletteState.spinning) return;
  rouletteState.bet = Economy.clampBet(rouletteState.bet + 10);
  playChip();
  rouletteRefresh();
};
document.getElementById("roulDown").onclick = () => {
  if (rouletteState.spinning) return;
  rouletteState.bet = Economy.clampBet(rouletteState.bet - 10);
  playChip();
  rouletteRefresh();
};

document.getElementById("roulTypeBtn").onclick = () => {
  if (rouletteState.spinning) return;
  rouletteState.typeIndex = (rouletteState.typeIndex + 1) % rouletteState.types.length;

  // if NUMBER, prompt for 0-11 (simple)
  if (rouletteState.types[rouletteState.typeIndex] === "NUMBER") {
    const n = prompt("Pick a number (0-11):", String(rouletteState.numberPick));
    const v = Math.max(0, Math.min(11, parseInt(n ?? "", 10)));
    if (!Number.isNaN(v)) rouletteState.numberPick = v;
  }

  playChip();
  rouletteRefresh();
};

let rouletteSettleT = 0;
document.getElementById("roulSpin").onclick = () => {
  if (rouletteState.spinning) return;
  const b = rouletteState.bet;
  if (!Economy.canBet(b)) return rouletteRefresh("Not enough balance.");
  Economy.bet(b);
  updateHUD();

  rouletteState.spinning = true;
  rouletteSettleT = 2.2; // settle time
  rouletteRefresh("Spinning...");
  spinRoulettePhysics();
};

// Determine win after settle
function rouletteResolve() {
  // Use wheel rotation angle as “result” (simple but consistent)
  const idx = rouletteResultFromWheelAngle(rouletteWheel.rotation.y);
  const color = wedgeColors[idx];
  const number = idx; // 0..11
  rouletteState.last = `#${number} • ${color.toUpperCase()}`;

  const t = rouletteState.types[rouletteState.typeIndex];
  let win = 0;

  if (t === "RED" && color === "red") win = rouletteState.bet * 2;
  if (t === "BLACK" && color === "black") win = rouletteState.bet * 2;
  if (t === "GREEN" && color === "green") win = rouletteState.bet * 12;
  if (t === "NUMBER" && number === rouletteState.numberPick) win = rouletteState.bet * 12;

  if (win > 0) {
    Economy.pay(win);
    playWin();
    rouletteRefresh(`WIN! +$${win - rouletteState.bet} profit`);
  } else {
    rouletteRefresh("No win. Try again.");
  }

  rouletteState.spinning = false;
}

// ======================
// Raycast click interactions (open UIs)
// ======================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function anyUIOpen() {
  return slotState.open || bj.open || rouletteState.open;
}

function onClick(e) {
  if (!started) return;
  if (anyUIOpen()) return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Interactables
  const objects = [rouletteWheel, bjTable];
  for (const s of slots) objects.push(s.button);

  const hits = raycaster.intersectObjects(objects, true);
  if (!hits.length) return;

  const hit = hits[0].object;

  if (hit === rouletteWheel) {
    rouletteOpen();
    return;
  }
  if (hit === bjTable) {
    bjOpen();
    return;
  }
  for (const s of slots) {
    if (hit === s.button) {
      slotOpen(s);
      return;
    }
  }
}
addEventListener("click", onClick);

// Close UIs with Escape
addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    if (slotState.open) slotClose();
    if (rouletteState.open) rouletteClose();
    if (bj.open) bjClose();
  }
});

// ======================
// Decorative “clearly readable” props near zones
// (simple icons: chips stacks + dice) — helps instantly tell areas
// ======================
function addChipStack(x, z, colorHex) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);

  const chipMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, metalness: 0.05, emissive: colorHex, emissiveIntensity: 0.12 });
  for (let i=0;i<5;i++){
    const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.12,12), chipMat);
    chip.position.set(0, 0.10 + i*0.13, 0);
    chip.castShadow = chip.receiveShadow = true;
    g.add(chip);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.6 })
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = chip.position.y + 0.02;
    g.add(ring);
  }
  return g;
}
addChipStack(-20, 8, 0x2bf7ff);  // roulette chips
addChipStack(18, 8, 0xff2bd6);   // slots chips
addChipStack(0, -22, 0xffd42b);  // blackjack chips

// ======================
// Animation + Updates
// ======================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  const t = clock.elapsedTime;

  // movement (disable when UI open)
  if (started && !anyUIOpen()) updateMovement(dt);

  // neon vibe
  neonA.position.x = -22 + Math.sin(t * 0.8) * 2.3;
  neonB.position.x =  22 + Math.sin(t * 0.8 + 1.7) * 2.3;
  sign.material.emissiveIntensity = 0.55 + Math.sin(t * 6.0) * 0.18;
  signLight.intensity = 130 + Math.sin(t * 6.0) * 40;

  // roulette wheel spins slowly always
  rouletteWheel.rotation.y += dt * 0.50;
  rouletteRim.material.emissiveIntensity = 0.85 + Math.sin(t * 5.5) * 0.18;

  // roulette settle countdown
  if (rouletteState.spinning) {
    rouletteSettleT -= dt;
    if (rouletteSettleT <= 0) {
      rouletteResolve();
    }
  }

  // slot “idle glow”
  for (const s of slots) {
    const idle = 0.25 + Math.sin(t * 5.0 + s.group.position.x * 0.2) * 0.08;
    if (!slotState.spinning || slotState.activeSlot !== s) {
      s.screenMat.emissiveIntensity = 0.30 + idle;
      s.trimMat.emissiveIntensity = 0.80;
      s.glow.intensity = 85;
      s.btnMat.emissiveIntensity = 0.20;
    }
    if (s.winT > 0) {
      s.winT -= dt;
      s.screenMat.emissiveIntensity = 0.75 + Math.sin(t*30)*0.25;
      s.trimMat.emissiveIntensity = 1.35;
      s.glow.intensity = 140;
      s.btnMat.emissiveIntensity = 0.9;

      const pop = 1.0 + 0.06 * Math.sin((1.0 - s.winT) * 16.0);
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
