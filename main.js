// ======================
// GTA-STYLE SMOOTH CASINO (ONE FILE main.js)
// - Smooth graphics (no pixel pipeline)
// - Decor: chandeliers, paintings, velvet ropes, plants, bar glow, signage
// - Crowd: dancers + gamblers (PG-13 vibe)
// - WASD + mouse look (pointer lock), tuned sensitivity
// - 120Hz simulation step (render uses monitor refresh automatically)
// - Playable games with real-ish rules:
//   * European Roulette (0-36) standard wheel order, real payouts
//   * Blackjack (dealer stands on 17, blackjack payout 3:2, double-down)
//   * Slots (reel strips + paytable + 1 payline evaluation)
// - Howler ambience (generated) no external audio files
// ======================

console.log("Smooth Casino main.js loaded ✅");

// ---------- Crash catcher ----------
window.addEventListener("error", (e) => console.error("JS ERROR:", e.message, "at", e.filename + ":" + e.lineno + ":" + e.colno));
window.addEventListener("unhandledrejection", (e) => console.error("PROMISE ERROR:", e.reason));

// ======================
// DOM + base CSS
// ======================
const canvas = document.getElementById("c");
const overlay = document.getElementById("overlay");

(function injectCSS() {
  const css = `
    html, body { margin:0; height:100%; overflow:hidden; background:#000; }
    #c { width:100vw; height:100vh; display:block; }
    #overlay{
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); color:#fff; z-index:9999; cursor:pointer;
      font:900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      user-select:none;
    }
    .uiWrap{
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.55); z-index:9998; backdrop-filter: blur(8px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:#fff;
    }
    .uiCard{
      width:min(720px, 92vw);
      border-radius:18px;
      background:rgba(16,14,24,.94);
      border:1px solid rgba(255,255,255,.12);
      box-shadow:0 30px 90px rgba(0,0,0,.60);
      overflow:hidden;
    }
    .uiHead{
      padding:16px 18px;
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(90deg, rgba(255,43,214,.20), rgba(43,247,255,.12));
      border-bottom:1px solid rgba(255,255,255,.10);
    }
    .uiTitle{ font-weight:1000; letter-spacing:.6px; }
    .uiClose{
      cursor:pointer; border:0; background:rgba(255,255,255,.10);
      color:#fff; padding:8px 10px; border-radius:10px;
      font-weight:900;
    }
    .uiBody{ padding:16px 18px 18px; }
    .uiRow{ display:flex; gap:12px; flex-wrap:wrap; }
    .pill{
      padding:10px 12px; border-radius:14px; background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.10);
      min-width: 170px;
    }
    .uiBtns{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .btn{
      cursor:pointer; border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.08);
      color:#fff; padding:10px 12px; border-radius:14px;
      font-weight:950;
    }
    .btnPrimary{
      background:linear-gradient(90deg, rgba(255,43,214,.35), rgba(43,247,255,.22));
      border:1px solid rgba(255,255,255,.20);
    }
    .msg{
      margin-top:12px; padding:10px 12px; border-radius:14px;
      background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.12);
      color:rgba(255,255,255,.94);
      min-height: 22px;
      line-height: 1.3;
    }
    .hint{
      position:fixed; left:14px; bottom:14px; z-index:9997;
      padding:10px 12px; border-radius:14px;
      background:rgba(0,0,0,.38); border:1px solid rgba(255,255,255,.12);
      color:rgba(255,255,255,.88);
      font:900 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      max-width: 720px;
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
  <div><b>WASD</b> move • <b>Shift</b> sprint • <b>Mouse</b> look • <b>Esc</b> closes a game UI</div>
  <div>Click games to play: <span style="color:#2bf7ff"><b>ROULETTE</b></span> • <span style="color:#ff2bd6"><b>SLOTS</b></span> • <span style="color:#ffd42b"><b>BLACKJACK</b></span></div>
`;
document.body.appendChild(hint);

const hud = document.createElement("div");
hud.className = "hint";
hud.style.left = "auto";
hud.style.right = "14px";
hud.style.maxWidth = "240px";
hud.innerHTML = `<div><b>BALANCE</b></div><div id="hudBal">$1000</div>`;
document.body.appendChild(hud);
const hudBal = document.getElementById("hudBal");

// ======================
// HOWLER — generated ambience (no files)
// ======================
function wavDataURIFromMonoFloat(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

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

function makeNoise(seconds = 1.2, amp = 0.18, sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const r = (Math.random() * 2 - 1) * amp;
    last = last * 0.92 + r * 0.08;
    s[i] = last;
  }
  return wavDataURIFromMonoFloat(s, sampleRate);
}

function makeMurmur(seconds = 1.6, amp = 0.10, sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  let v = 0;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    // low formant-ish wobble + noise, feels like a crowd bed
    phase += (2 * Math.PI * (80 + 20 * Math.sin(i / sampleRate * 0.6))) / sampleRate;
    const tone = Math.sin(phase) * 0.12 + Math.sin(phase * 0.5) * 0.08;
    const noise = (Math.random() * 2 - 1) * amp;
    v = v * 0.94 + (tone + noise) * 0.06;
    s[i] = v;
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

function makeTone(freq = 440, seconds = 0.14, amp = 0.22, type = "sine", sampleRate = 44100) {
  const n = Math.floor(seconds * sampleRate);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / (0.012 * sampleRate));
    const decay = Math.pow(1 - i / n, 2.2);
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
  roomAir:  new Howl({ src: [makeNoise(1.25, 0.12)], loop: true, volume: 0.18 }),
  crowd:    new Howl({ src: [makeMurmur(1.65, 0.10)], loop: true, volume: 0.22 }),
  chip:     new Howl({ src: [makeClick(0.03, 0.95)], volume: 0.65 }),
  roul:     new Howl({ src: [makeTone(140, 0.22, 0.16, "saw")], volume: 0.50 }),
  slotSpin: new Howl({ src: [makeTone(260, 0.18, 0.16, "square")], volume: 0.52 }),
  win1:     new Howl({ src: [makeTone(523.25, 0.14, 0.22, "sine")], volume: 0.80 }),
  win2:     new Howl({ src: [makeTone(659.25, 0.14, 0.20, "sine")], volume: 0.80 }),
  win3:     new Howl({ src: [makeTone(783.99, 0.16, 0.18, "sine")], volume: 0.80 })
};

function playChip() { SND.chip.play(); }
function playWin() { SND.win1.play(); setTimeout(()=>SND.win2.play(), 110); setTimeout(()=>SND.win3.play(), 220); }

// ======================
// ECONOMY
// ======================
const Economy = {
  balance: 1000,
  clampBet(b) { return Math.max(5, Math.min(1000, b|0)); },
  canBet(b) { return this.balance >= b; },
  bet(b) { this.balance -= b; },
  pay(x) { this.balance += x; }
};
function updateHUD() { hudBal.textContent = `$${Economy.balance}`; }
updateHUD();

// ======================
// THREE — Smooth renderer
// ======================
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.physicallyCorrectLights = true;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07060b);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
camera.rotation.order = "YXZ";

// ======================
// LIGHTING (casino vibe)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.05));
scene.add(new THREE.HemisphereLight(0xb8d3ff, 0x120014, 0.15));

const key = new THREE.SpotLight(0xfff2d2, 950, 260, Math.PI/6, 0.45, 1.1);
key.position.set(0, 22, 6);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key, key.target);

const neonPink = new THREE.PointLight(0xff2bd6, 160, 85, 2);
neonPink.position.set(-26, 8, 12);
scene.add(neonPink);

const neonCyan = new THREE.PointLight(0x2bf7ff, 160, 85, 2);
neonCyan.position.set(26, 8, -12);
scene.add(neonCyan);

const neonGold = new THREE.PointLight(0xffd42b, 110, 70, 2);
neonGold.position.set(0, 9, -34);
scene.add(neonGold);

// ======================
// Materials / simple procedural textures
// ======================
function canvasTex(drawFn, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  drawFn(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const wallTex = canvasTex((g,s)=>{
  g.fillStyle="#16121d"; g.fillRect(0,0,s,s);
  // panels
  for (let y=0;y<s;y+=64){
    for (let x=0;x<s;x+=64){
      g.fillStyle = ((x+y)/64)%2 ? "#1e1830" : "#241c33";
      g.fillRect(x+4,y+6,56,52);
      g.fillStyle="rgba(255,255,255,0.05)";
      g.fillRect(x+8,y+10,30,2);
    }
  }
  // trim lines
  g.fillStyle="#b58a2a";
  for (let i=0;i<s;i+=32) g.fillRect(i,0,2,s);
}, 256);
wallTex.repeat.set(4, 2);

const carpetTex = canvasTex((g,s)=>{
  g.fillStyle="#2a0d33"; g.fillRect(0,0,s,s);
  // pattern
  for (let y=0;y<s;y+=24){
    for (let x=0;x<s;x+=24){
      const on = ((x/24 + y/24) % 2) === 0;
      g.fillStyle = on ? "#3b1249" : "#1c0822";
      g.fillRect(x,y,24,24);
      g.fillStyle="rgba(255,212,43,0.12)";
      g.beginPath(); g.arc(x+12,y+12,3,0,Math.PI*2); g.fill();
    }
  }
  g.strokeStyle="rgba(43,247,255,0.10)";
  g.lineWidth=2;
  for (let i=0;i<12;i++){
    g.beginPath();
    g.moveTo(0, i*s/12);
    g.lineTo(s, i*s/12);
    g.stroke();
  }
}, 256);
carpetTex.repeat.set(8, 8);

const woodTex = canvasTex((g,s)=>{
  g.fillStyle="#3b2416"; g.fillRect(0,0,s,s);
  for (let y=0;y<s;y++){
    const w = 0.08 + 0.05*Math.sin(y*0.06);
    g.fillStyle = `rgba(0,0,0,${w})`;
    g.fillRect(0,y,s,1);
  }
  g.fillStyle="rgba(181,138,42,0.35)";
  g.fillRect(0, 10, s, 6);
  g.fillRect(0, s-16, s, 6);
}, 256);
woodTex.repeat.set(2, 2);

// ======================
// ROOM (real interior)
// ======================
const ROOM_W = 130;
const ROOM_D = 130;
const ROOM_H = 22;

const room = new THREE.Mesh(
  new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D),
  new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92, metalness: 0.03, side: THREE.BackSide })
);
room.position.y = ROOM_H/2;
room.receiveShadow = true;
scene.add(room);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W-8, ROOM_D-8),
  new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.98, metalness: 0.0 })
);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W-4, ROOM_D-4),
  new THREE.MeshStandardMaterial({ color: 0x1a1523, roughness: 0.95, metalness: 0 })
);
ceiling.rotation.x = Math.PI/2;
ceiling.position.set(0, ROOM_H-0.3, 0);
scene.add(ceiling);

// ======================
// Decor: chandeliers, paintings, ropes, plants, bar
// ======================
function makePaintingTexture(seed = 1) {
  return canvasTex((g,s)=>{
    // abstract "famous painting" vibe (stylized, no copyrighted image)
    g.fillStyle="#0b0b12"; g.fillRect(0,0,s,s);
    const grad = g.createLinearGradient(0,0,s,s);
    grad.addColorStop(0, "#ff2bd6");
    grad.addColorStop(0.5, "#2bf7ff");
    grad.addColorStop(1, "#ffd42b");
    g.fillStyle = grad;
    g.globalAlpha = 0.25;
    g.fillRect(0,0,s,s);
    g.globalAlpha = 1;

    // brushy blocks
    function rnd(n){ seed = (seed*1664525 + 1013904223) >>> 0; return (seed % n); }
    for (let i=0;i<80;i++){
      const x=rnd(s), y=rnd(s), w=20+rnd(120), h=10+rnd(80);
      g.fillStyle = `rgba(${80+rnd(175)},${40+rnd(160)},${80+rnd(175)},${0.10+rnd(25)/120})`;
      g.fillRect(x,y,w,h);
    }

    // bright subject blob
    g.fillStyle="rgba(255,255,255,0.20)";
    g.beginPath(); g.arc(s*0.52,s*0.46,s*0.22,0,Math.PI*2); g.fill();
    g.fillStyle="rgba(0,0,0,0.25)";
    g.beginPath(); g.arc(s*0.57,s*0.52,s*0.18,0,Math.PI*2); g.fill();
  }, 256);
}

function addPainting(x, y, z, ry, labelText) {
  const tex = makePaintingTexture((Math.random()*1000)|0);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.6, 0.15),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.05 })
  );
  frame.position.set(x, y, z);
  frame.rotation.y = ry;
  frame.castShadow = true;
  scene.add(frame);

  // frame border
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(4.35, 2.75, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x3a2a14, roughness: 0.85, metalness: 0.05 })
  );
  border.position.set(x, y, z);
  border.rotation.y = ry;
  scene.add(border);

  const l = new THREE.SpotLight(0xfff2d2, 160, 10, Math.PI/7, 0.6, 1.0);
  l.position.set(x + Math.sin(ry)*2.5, y+1.8, z + Math.cos(ry)*2.5);
  l.target.position.set(x, y, z);
  scene.add(l, l.target);

  if (labelText) {
    const tag = makeLabelSprite(labelText, "#ffffff", "rgba(0,0,0,0.6)", "#ffd42b");
    tag.position.set(x, y-1.9, z);
    tag.rotation.y = ry;
    tag.scale.set(6.2, 1.6, 1);
    scene.add(tag);
  }
}

function addChandelier(x, z) {
  const g = new THREE.Group();
  g.position.set(x, ROOM_H - 2.8, z);
  scene.add(g);

  const metal = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.35, metalness: 0.75 });
  const gold  = new THREE.MeshStandardMaterial({ color: 0xb58a2a, roughness: 0.25, metalness: 0.85 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.2, 12), metal);
  stem.position.y = 0.8;
  g.add(stem);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.10, 12, 32), gold);
  ring.rotation.x = Math.PI/2;
  g.add(ring);

  for (let i=0;i<10;i++){
    const a = (i/10)*Math.PI*2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c6, emissiveIntensity: 1.4, roughness: 0.2 })
    );
    bulb.position.set(Math.cos(a)*1.2, -0.1, Math.sin(a)*1.2);
    g.add(bulb);
  }

  const light = new THREE.PointLight(0xfff2c6, 520, 22, 2);
  light.position.set(0, -0.15, 0);
  g.add(light);

  g.userData.spin = 0.25 + Math.random()*0.25;
  return g;
}

function addPlant(x, z) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.65, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9, metalness: 0.05 })
  );
  pot.position.set(x, 0.28, z);
  pot.castShadow = pot.receiveShadow = true;
  scene.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a7a3f, roughness: 0.85, metalness: 0.02 });
  for (let i=0;i<10;i++){
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 10), leafMat);
    leaf.position.set(x + (Math.random()-0.5)*0.35, 0.85 + Math.random()*0.35, z + (Math.random()-0.5)*0.35);
    leaf.rotation.set(Math.random()*0.6, Math.random()*Math.PI*2, Math.random()*0.6);
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

function addRopeLine(x0,z0, x1,z1, posts=4, color=0x2bf7ff) {
  const postMat = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.55, metalness: 0.6 });
  const ropeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2, emissive: color, emissiveIntensity: 0.2 });

  const points = [];
  for (let i=0;i<=posts;i++){
    const t = i/posts;
    const x = x0 + (x1-x0)*t;
    const z = z0 + (z1-z0)*t;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.10,1.0,12), postMat);
    post.position.set(x, 0.5, z);
    post.castShadow = true;
    scene.add(post);

    points.push(new THREE.Vector3(x, 0.82 - Math.sin(t*Math.PI)*0.12, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.03, 8, false), ropeMat);
  tube.castShadow = true;
  scene.add(tube);
}

function addBar(x, z) {
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(14, 1.4, 3.2),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0.05 })
  );
  bar.position.set(x, 0.7, z);
  bar.castShadow = bar.receiveShadow = true;
  scene.add(bar);

  const neon = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.25, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 1.2, roughness: 0.2 })
  );
  neon.position.set(x, 1.35, z+1.62);
  scene.add(neon);

  const l = new THREE.PointLight(0xff2bd6, 160, 18, 2);
  l.position.set(x, 2.6, z+1.5);
  scene.add(l);
}

const chandeliers = [];
for (let x=-24; x<=24; x+=12) for (let z=-24; z<=24; z+=12) chandeliers.push(addChandelier(x, z));

addPainting(-ROOM_W/2 + 0.6, 7.5, -10, Math.PI/2, "MASTERPIECE");
addPainting( ROOM_W/2 - 0.6, 7.5,  10,-Math.PI/2, "CLASSIC ART");
addPainting(  10, 7.2, -ROOM_D/2 + 0.6, 0, "GOLDEN AGE");
addPainting( -10, 7.2, -ROOM_D/2 + 0.6, 0, "ROYAL VELVET");

addPlant(-40,  38);
addPlant( 40,  38);
addPlant(-40, -38);
addPlant( 40, -38);

addBar(0, 44);

// velvet ropes guide you to games
addRopeLine(-10, 20, -10, -20, 6, 0x2bf7ff);
addRopeLine( 10, 20,  10, -20, 6, 0xff2bd6);

// ======================
// Labels (sprites)
// ======================
function makeLabelSprite(text, fg = "#ffffff", bg = "rgba(0,0,0,0.65)", accent = "#2bf7ff") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");

  // background
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  // border
  g.fillStyle = accent;
  g.fillRect(0, 0, c.width, 6);
  g.fillRect(0, c.height - 6, c.width, 6);
  g.fillRect(0, 0, 6, c.height);
  g.fillRect(c.width - 6, 0, 6, c.height);

  // inner shine
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.fillRect(14, 16, c.width - 28, 4);

  // text
  g.fillStyle = fg;
  g.font = "1000 56px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width/2, c.height/2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(10, 2.5, 1);
  return spr;
}

// ======================
// Layout (smooth)
// ======================
const LAYOUT = {
  spawn: new THREE.Vector3(0, 1.75, 34),
  roulette: new THREE.Vector3(-28, 0, 0),
  slotsRow: new THREE.Vector3(18, 0, 0),
  blackjack: new THREE.Vector3(0, 0, -30),
  danceFloor: new THREE.Vector3(-10, 0, 34),
};

const aisle = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 100),
  new THREE.MeshStandardMaterial({ color: 0x0b0912, roughness: 0.9, metalness: 0.05 })
);
aisle.rotation.x = -Math.PI/2;
aisle.position.y = 0.002;
aisle.receiveShadow = true;
scene.add(aisle);

// dance floor glow tiles
const dance = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.MeshStandardMaterial({ color: 0x0f0b18, roughness: 0.35, metalness: 0.10, emissive: 0x2bf7ff, emissiveIntensity: 0.07 })
);
dance.rotation.x = -Math.PI/2;
dance.position.set(LAYOUT.danceFloor.x, 0.004, LAYOUT.danceFloor.z);
dance.receiveShadow = true;
scene.add(dance);

const danceLight = new THREE.PointLight(0x2bf7ff, 200, 28, 2);
danceLight.position.set(LAYOUT.danceFloor.x, 6.0, LAYOUT.danceFloor.z);
scene.add(danceLight);

// ======================
// PLAYER controls (WASD + mouse look)
// ======================
let started = false;
let locked = false;

const keys = { w:false, a:false, s:false, d:false, shift:false };

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyW") keys.w = true;
  if (e.code === "KeyA") keys.a = true;
  if (e.code === "KeyS") keys.s = true;
  if (e.code === "KeyD") keys.d = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
  if (e.code === "Escape") closeAllUIs();
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
const pitchLimit = Math.PI/2 - 0.08;
// a bit higher than default, but controllable
const MOUSE_SENS = 0.0037;

document.addEventListener("mousemove", (e) => {
  if (!locked) return;
  yaw   -= e.movementX * MOUSE_SENS;
  pitch -= e.movementY * MOUSE_SENS;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  camera.rotation.set(pitch, yaw, 0);
});

const player = {
  pos: LAYOUT.spawn.clone(),
  vel: new THREE.Vector3(),
  eye: 1.75,
  walk: 5.0,
  sprint: 7.8,
  accel: 26,
  friction: 16
};
camera.position.copy(player.pos);

function approach(cur, target, delta) {
  if (cur < target) return Math.min(cur + delta, target);
  return Math.max(cur - delta, target);
}

function anyUIOpen() { return UI.state !== "none"; }

function updateMovement(dt) {
  if (!started || anyUIOpen()) return;

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

  const speed = keys.shift ? player.sprint : player.walk;
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

  // keep inside room
  const bx = ROOM_W/2 - 3;
  const bz = ROOM_D/2 - 3;
  player.pos.x = THREE.MathUtils.clamp(player.pos.x, -bx, bx);
  player.pos.z = THREE.MathUtils.clamp(player.pos.z, -bz, bz);

  camera.position.set(player.pos.x, player.eye, player.pos.z);

  // mild FOV sprint
  const moving = player.vel.lengthSq() > 0.3;
  const desiredFov = (keys.shift && moving) ? 76 : 70;
  camera.fov = approach(camera.fov, desiredFov, 14 * dt);
  camera.updateProjectionMatrix();
}

overlay.addEventListener("click", () => {
  if (!started) {
    started = true;
    overlay.style.display = "none";
    SND.roomAir.play();
    SND.crowd.play();
  }
  renderer.domElement.requestPointerLock?.();
});

// ======================
// CANNON (only used lightly)
// ======================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.solver.iterations = 10;

const mat = new CANNON.Material("m");
world.defaultContactMaterial = new CANNON.ContactMaterial(mat, mat, { friction: 0.10, restitution: 0.6 });

const groundBody = new CANNON.Body({ mass: 0, material: mat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

// ======================
// NPC Crowd (dancers + gamblers) — stylized low-poly
// ======================
const npcs = [];
function makePerson(style = "dancer") {
  const g = new THREE.Group();

  // body materials
  const skin = new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.65, metalness: 0.02 });
  const suit = new THREE.MeshStandardMaterial({ color: style==="dancer" ? 0x2bf7ff : 0x141018, roughness: 0.55, metalness: 0.08 });
  const cloth = new THREE.MeshStandardMaterial({ color: style==="dancer" ? 0xff2bd6 : 0xffd42b, roughness: 0.70, metalness: 0.02 });

  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), skin);
  head.position.y = 1.62;
  head.castShadow = true;
  g.add(head);

  // torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.55, 8, 14), cloth);
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);

  // legs
  const leg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.55, 6, 12), suit);
  const leg2 = leg1.clone();
  leg1.position.set(-0.12, 0.45, 0);
  leg2.position.set( 0.12, 0.45, 0);
  leg1.castShadow = leg2.castShadow = true;
  g.add(leg1, leg2);

  // arms
  const arm1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 6, 12), suit);
  const arm2 = arm1.clone();
  arm1.position.set(-0.32, 1.15, 0);
  arm2.position.set( 0.32, 1.15, 0);
  arm1.castShadow = arm2.castShadow = true;
  g.add(arm1, arm2);

  g.userData = { style, arm1, arm2, leg1, leg2, seed: Math.random()*1000, t: 0 };
  return g;
}

function spawnDancers(centerX, centerZ, count = 10) {
  for (let i=0;i<count;i++){
    const p = makePerson("dancer");
    const r = 4 + Math.random()*4;
    const a = Math.random()*Math.PI*2;
    p.position.set(centerX + Math.cos(a)*r, 0, centerZ + Math.sin(a)*r);
    p.rotation.y = Math.random()*Math.PI*2;
    scene.add(p);
    npcs.push(p);
  }
}

function spawnGamblers(x0,z0, x1,z1, count=10) {
  for (let i=0;i<count;i++){
    const p = makePerson("gambler");
    p.position.set(
      x0 + (x1-x0)*Math.random(),
      0,
      z0 + (z1-z0)*Math.random()
    );
    p.rotation.y = Math.random()*Math.PI*2;
    scene.add(p);
    npcs.push(p);
  }
}

spawnDancers(LAYOUT.danceFloor.x, LAYOUT.danceFloor.z, 12);
spawnGamblers(-35, -10, -18,  10, 8);  // near roulette
spawnGamblers( 14, -10,  34,  10, 10); // near slots
spawnGamblers(-6, -40,   6, -24, 8);   // near blackjack

// ======================
// GAMES: visuals + interactions + UIs
// ======================

const interactables = [];
function addInteractable(mesh, type, ref) {
  mesh.userData.interactive = true;
  mesh.userData.type = type;
  mesh.userData.ref = ref;
  interactables.push(mesh);
}

function addGameLabel(group, text, accent) {
  const label = makeLabelSprite(text, "#ffffff", "rgba(0,0,0,0.62)", accent);
  label.position.set(0, 6.4, 0);
  group.add(label);
}

// --------------------------------------
// ROULETTE (European 0–36, standard order)
// --------------------------------------
const ROULETTE_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]); // European standard

function rouletteColor(n) {
  if (n === 0) return "GREEN";
  return RED_NUMBERS.has(n) ? "RED" : "BLACK";
}

const roulette = {
  group: new THREE.Group(),
  spinning: false,
  bet: 25,
  betKind: "RED",   // RED, BLACK, EVEN, ODD, LOW, HIGH, DOZEN1, DOZEN2, DOZEN3, STRAIGHT
  straight: 17,
  last: null,
  settleT: 0,
  win: 0,
};

roulette.group.position.copy(LAYOUT.roulette);
scene.add(roulette.group);

// base table
const roulBase = new THREE.Mesh(
  new THREE.CylinderGeometry(5.7, 6.0, 1.0, 32),
  new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.88, metalness: 0.05 })
);
roulBase.position.y = 0.5;
roulBase.castShadow = roulBase.receiveShadow = true;
roulette.group.add(roulBase);

// wheel
const wheelTex = canvasTex((g,s)=>{
  g.fillStyle="#0d0d14"; g.fillRect(0,0,s,s);
  const cx=s/2, cy=s/2;
  const wedges=37;
  for (let i=0;i<wedges;i++){
    const a0 = (i/wedges)*Math.PI*2;
    const a1 = ((i+1)/wedges)*Math.PI*2;
    const n = ROULETTE_ORDER[i];
    g.beginPath(); g.moveTo(cx,cy); g.arc(cx,cy,s*0.47,a0,a1); g.closePath();
    const col = rouletteColor(n);
    g.fillStyle = col==="RED" ? "#c82424" : col==="BLACK" ? "#16161a" : "#1aa85b";
    g.fill();

    // number dot ring
    const mid=(a0+a1)/2;
    const tx=cx + Math.cos(mid)*s*0.38;
    const ty=cy + Math.sin(mid)*s*0.38;
    g.fillStyle="rgba(255,255,255,0.9)";
    g.fillRect((tx|0), (ty|0), 2, 2);
  }
  g.fillStyle="#2bf7ff"; g.fillRect(cx-3, cy-3, 6, 6);
}, 512);

const roulWheel = new THREE.Mesh(
  new THREE.CylinderGeometry(4.4, 4.4, 0.38, 48),
  new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.45, metalness: 0.12 })
);
roulWheel.position.y = 1.12;
roulWheel.castShadow = roulWheel.receiveShadow = true;
roulette.group.add(roulWheel);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(4.35, 0.12, 14, 64),
  new THREE.MeshStandardMaterial({ color: 0x2bf7ff, emissive: 0x2bf7ff, emissiveIntensity: 0.9, roughness: 0.25 })
);
rim.rotation.x = Math.PI/2;
rim.position.y = 1.32;
roulette.group.add(rim);

const roulLight = new THREE.PointLight(0x2bf7ff, 130, 26, 2);
roulLight.position.set(roulette.group.position.x, 3.8, roulette.group.position.z);
scene.add(roulLight);

addGameLabel(roulette.group, "ROULETTE", "#2bf7ff");
addInteractable(roulWheel, "roulette", roulette);

// --------------------------------------
// SLOTS (reel strips + paytable)
// --------------------------------------
const slots = {
  group: new THREE.Group(),
  bet: 10,
  spinning: false,
  reels: [0,0,0],
  last: null,
};

slots.group.position.copy(LAYOUT.slotsRow);
scene.add(slots.group);

addGameLabel(slots.group, "SLOTS", "#ff2bd6");

// symbol set & reel strips (more realistic: not uniform odds)
const SYMBOLS = [
  { s:"7",   mult3: 30, mult2: 6 },
  { s:"💎",  mult3: 15, mult2: 4 },
  { s:"🔔",  mult3: 10, mult2: 3 },
  { s:"🍒",  mult3: 6,  mult2: 2 },
  { s:"🍋",  mult3: 5,  mult2: 2 },
  { s:"🍇",  mult3: 4,  mult2: 1 },
  { s:"⭐",  mult3: 12, mult2: 4 },
];

function makeStrip() {
  // weighted strip: common symbols repeat more
  const strip = [];
  const pushN = (sym, n) => { for (let i=0;i<n;i++) strip.push(sym); };
  pushN("🍇", 10);
  pushN("🍋", 10);
  pushN("🍒", 9);
  pushN("🔔", 6);
  pushN("⭐", 5);
  pushN("💎", 3);
  pushN("7",  2);
  // shuffle
  for (let i=strip.length-1;i>0;i--){
    const j = (Math.random()*(i+1))|0;
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}
const REEL_STRIPS = [makeStrip(), makeStrip(), makeStrip()];

function symInfo(sym) { return SYMBOLS.find(x=>x.s===sym); }

// visuals: 3 machines as one readable bank
function makeSlotMachineVisual(x) {
  const g = new THREE.Group();
  g.position.set(x, 0, 0);
  slots.group.add(g);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 3.8, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.55, metalness: 0.15 })
  );
  body.position.y = 1.9;
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  // screen texture updated when spinning
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 512; screenCanvas.height = 256;
  const sg = screenCanvas.getContext("2d");
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 8;

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0xff2bd6,
    emissiveIntensity: 0.18,
    roughness: 0.45,
    metalness: 0.05
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), screenMat);
  screen.position.set(0, 2.55, 1.02);
  g.add(screen);

  // button
  const btn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0x0f0f14, emissive: 0xffd42b, emissiveIntensity: 0.18, roughness: 0.45 })
  );
  btn.rotation.x = Math.PI/2;
  btn.position.set(1.05, 1.2, 1.05);
  g.add(btn);

  const glow = new THREE.PointLight(0xff2bd6, 95, 20, 2);
  glow.position.set(slots.group.position.x + x, 3.4, slots.group.position.z);
  scene.add(glow);

  addInteractable(btn, "slots", { btn, screenTex, sg, glow, screenMat, group: g });

  function drawReels(a,b,c, msg="") {
    sg.clearRect(0,0,512,256);
    // frame
    sg.fillStyle = "rgba(0,0,0,0.75)";
    sg.fillRect(0,0,512,256);

    const grad = sg.createLinearGradient(0,0,512,0);
    grad.addColorStop(0, "rgba(255,43,214,0.25)");
    grad.addColorStop(1, "rgba(43,247,255,0.18)");
    sg.fillStyle = grad;
    sg.fillRect(0,0,512,18);

    // reel windows
    sg.fillStyle="rgba(255,255,255,0.08)";
    for (let i=0;i<3;i++){
      sg.fillRect(40 + i*155, 60, 132, 120);
      sg.strokeStyle="rgba(255,255,255,0.18)";
      sg.lineWidth=3;
      sg.strokeRect(40 + i*155, 60, 132, 120);
    }

    // big symbols
    sg.fillStyle="#fff";
    sg.font="1000 90px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    sg.textAlign="center";
    sg.textBaseline="middle";
    sg.fillText(a, 106, 120);
    sg.fillText(b, 261, 120);
    sg.fillText(c, 416, 120);

    // message line
    sg.fillStyle="rgba(255,255,255,0.9)";
    sg.font="900 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    sg.textAlign="left";
    sg.fillText(msg, 24, 230);

    screenTex.needsUpdate = true;
  }

  drawReels("🍒","🔔","7","CLICK SPIN");
  return { drawReels, btn, screenTex, sg, glow, screenMat, group: g };
}

const slotVisuals = [
  makeSlotMachineVisual(-4.2),
  makeSlotMachineVisual( 0.0),
  makeSlotMachineVisual( 4.2)
];

// --------------------------------------
// BLACKJACK (more real rules + double)
// --------------------------------------
const blackjack = {
  group: new THREE.Group(),
  open: false,
  bet: 25,
  deck: [],
  player: [],
  dealer: [],
  phase: "ready", // ready, player, dealer
  canDouble: false,
};

blackjack.group.position.copy(LAYOUT.blackjack);
scene.add(blackjack.group);

addGameLabel(blackjack.group, "BLACKJACK", "#ffd42b");

const felt = new THREE.MeshStandardMaterial({ color: 0x0e6b3a, roughness: 0.75, metalness: 0.02, emissive: 0x001a08, emissiveIntensity: 0.14 });
const bjBase = new THREE.Mesh(
  new THREE.CylinderGeometry(4.3, 4.6, 0.75, 28),
  new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.88, metalness: 0.05 })
);
bjBase.position.y = 0.38;
bjBase.castShadow = bjBase.receiveShadow = true;
blackjack.group.add(bjBase);

const bjTop = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.40, 28), felt);
bjTop.position.y = 1.06;
bjTop.castShadow = bjTop.receiveShadow = true;
blackjack.group.add(bjTop);
addInteractable(bjTop, "blackjack", blackjack);

const bjLight = new THREE.PointLight(0xffd42b, 170, 20, 2);
bjLight.position.set(blackjack.group.position.x, 3.8, blackjack.group.position.z);
scene.add(bjLight);

// ======================
// UI SYSTEM
// ======================
const UI = {
  state: "none", // none, roulette, slots, blackjack
  wraps: {},
  open(which) {
    closeAllUIs();
    UI.state = which;
    UI.wraps[which].style.display = "flex";
    updateHUD();
  },
  close(which) {
    if (UI.wraps[which]) UI.wraps[which].style.display = "none";
    UI.state = "none";
  }
};
function closeAllUIs() {
  for (const k of Object.keys(UI.wraps)) UI.wraps[k].style.display = "none";
  UI.state = "none";
}

// ======================
// Roulette UI (real payouts)
// ======================
const rouletteUI = document.createElement("div");
rouletteUI.className = "uiWrap";
rouletteUI.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">ROULETTE (EUROPEAN 0–36)</div>
      <button class="uiClose" id="roulClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="roulBal">$0</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="roulBet">$25</div></div>
        <div class="pill"><div><b>Bet Type</b></div><div id="roulType">RED</div></div>
      </div>

      <div class="uiRow" style="margin-top:12px;">
        <div class="pill" style="flex:1; min-width:260px;">
          <div><b>Last Result</b></div>
          <div id="roulResult">—</div>
        </div>
        <div class="pill" style="flex:1; min-width:260px;">
          <div><b>Payout</b></div>
          <div id="roulPayout">1:1</div>
        </div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="roulDown">Bet -</button>
        <button class="btn" id="roulUp">Bet +</button>
        <button class="btn" id="roulKind">Change Bet Type</button>
        <button class="btn" id="roulPick" style="display:none;">Pick Number</button>
        <button class="btn btnPrimary" id="roulSpin">SPIN</button>
      </div>

      <div class="msg" id="roulMsg">
        Types: RED/BLACK/EVEN/ODD/LOW(1–18)/HIGH(19–36)/DOZENS/STRAIGHT.
      </div>
    </div>
  </div>
`;
document.body.appendChild(rouletteUI);
UI.wraps.roulette = rouletteUI;

const r$ = (id) => document.getElementById(id);
document.getElementById("roulClose").onclick = () => UI.close("roulette");

const ROULETTE_KINDS = [
  "RED","BLACK","EVEN","ODD","LOW","HIGH",
  "DOZEN1","DOZEN2","DOZEN3",
  "STRAIGHT"
];

function roulettePayout(kind) {
  if (kind === "STRAIGHT") return "35:1";
  if (kind.startsWith("DOZEN")) return "2:1";
  return "1:1";
}

function rouletteKindText() {
  if (roulette.betKind === "STRAIGHT") return `STRAIGHT (${roulette.straight})`;
  if (roulette.betKind === "DOZEN1") return "DOZEN (1–12)";
  if (roulette.betKind === "DOZEN2") return "DOZEN (13–24)";
  if (roulette.betKind === "DOZEN3") return "DOZEN (25–36)";
  return roulette.betKind;
}

function rouletteRefresh(msg) {
  r$("roulBal").textContent = `$${Economy.balance}`;
  r$("roulBet").textContent = `$${roulette.bet}`;
  r$("roulType").textContent = rouletteKindText();
  r$("roulPayout").textContent = roulettePayout(roulette.betKind);
  r$("roulResult").textContent = roulette.last ? roulette.last : "—";
  r$("roulPick").style.display = (roulette.betKind === "STRAIGHT") ? "inline-block" : "none";
  if (msg) r$("roulMsg").textContent = msg;
  updateHUD();
}

r$("roulUp").onclick = () => { if (roulette.spinning) return; roulette.bet = Economy.clampBet(roulette.bet + 10); playChip(); rouletteRefresh(); };
r$("roulDown").onclick = () => { if (roulette.spinning) return; roulette.bet = Economy.clampBet(roulette.bet - 10); playChip(); rouletteRefresh(); };

r$("roulKind").onclick = () => {
  if (roulette.spinning) return;
  const idx = ROULETTE_KINDS.indexOf(roulette.betKind);
  roulette.betKind = ROULETTE_KINDS[(idx + 1) % ROULETTE_KINDS.length];
  playChip();
  rouletteRefresh();
};

r$("roulPick").onclick = () => {
  if (roulette.spinning) return;
  const n = prompt("Pick a number (0–36):", String(roulette.straight));
  const v = Math.max(0, Math.min(36, parseInt(n ?? "", 10)));
  if (!Number.isNaN(v)) roulette.straight = v;
  playChip();
  rouletteRefresh();
};

function rouletteWinsNumber(n) {
  const col = rouletteColor(n);
  const kind = roulette.betKind;

  if (kind === "RED") return col === "RED";
  if (kind === "BLACK") return col === "BLACK";
  if (kind === "EVEN") return n !== 0 && (n % 2 === 0);
  if (kind === "ODD")  return n !== 0 && (n % 2 === 1);
  if (kind === "LOW")  return n >= 1 && n <= 18;
  if (kind === "HIGH") return n >= 19 && n <= 36;
  if (kind === "DOZEN1") return n >= 1 && n <= 12;
  if (kind === "DOZEN2") return n >= 13 && n <= 24;
  if (kind === "DOZEN3") return n >= 25 && n <= 36;
  if (kind === "STRAIGHT") return n === roulette.straight;
  return false;
}

function rouletteWinAmount(bet) {
  if (roulette.betKind === "STRAIGHT") return bet * 36; // returns bet + profit (35:1 profit)
  if (roulette.betKind.startsWith("DOZEN")) return bet * 3; // bet + 2:1 profit
  return bet * 2; // bet + 1:1 profit
}

function rouletteSpin() {
  if (roulette.spinning) return;
  const b = roulette.bet;
  if (!Economy.canBet(b)) return rouletteRefresh("Not enough balance.");
  Economy.bet(b);
  updateHUD();

  roulette.spinning = true;
  roulette.settleT = 2.8;
  roulette.win = 0;

  // audio + spin animation
  SND.roul.play();
  playChip();

  // choose uniform outcome (real roulette is uniform)
  const n = (Math.random() * 37) | 0; // 0..36
  roulette._pendingNumber = n;

  rouletteRefresh("Spinning...");
}

r$("roulSpin").onclick = () => rouletteSpin();

// --------------------------------------
// Slots UI
// --------------------------------------
const slotsUI = document.createElement("div");
slotsUI.className = "uiWrap";
slotsUI.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">SLOTS (3-REEL)</div>
      <button class="uiClose" id="slotClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="slotBal">$0</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="slotBet">$10</div></div>
        <div class="pill"><div><b>Last</b></div><div id="slotLast">—</div></div>
      </div>

      <div class="pill" style="margin-top:12px; font-size:24px;">
        <div><b>Payline</b></div>
        <div id="slotReels" style="font-weight:1000; font-size:34px; letter-spacing:3px;">— — —</div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="slotDown">Bet -</button>
        <button class="btn" id="slotUp">Bet +</button>
        <button class="btn btnPrimary" id="slotSpin">SPIN</button>
      </div>

      <div class="msg" id="slotMsg">
        3-match pays per symbol • 2-match pays smaller. Rarer symbols hit less often.
      </div>
    </div>
  </div>
`;
document.body.appendChild(slotsUI);
UI.wraps.slots = slotsUI;

const s$ = (id)=>document.getElementById(id);
document.getElementById("slotClose").onclick = ()=>UI.close("slots");

function slotsRefresh(msg) {
  s$("slotBal").textContent = `$${Economy.balance}`;
  s$("slotBet").textContent = `$${slots.bet}`;
  s$("slotReels").textContent = slots.last ? slots.last.join(" ") : "— — —";
  s$("slotLast").textContent = slots._lastMsg || "—";
  if (msg) s$("slotMsg").textContent = msg;
  updateHUD();
}

s$("slotUp").onclick = ()=>{ if (slots.spinning) return; slots.bet = Economy.clampBet(slots.bet + 5); playChip(); slotsRefresh(); };
s$("slotDown").onclick = ()=>{ if (slots.spinning) return; slots.bet = Economy.clampBet(slots.bet - 5); playChip(); slotsRefresh(); };

function spinOneReel(strip, index) {
  // advance 12–30 steps to simulate spin
  const steps = 12 + ((Math.random()*18)|0);
  return (index + steps) % strip.length;
}

function evalSlots(a,b,c, bet) {
  // payout based on symbol multipliers
  // 3 same: mult3; 2 same (adjacent): mult2
  if (a===b && b===c) {
    const info = symInfo(a);
    const win = bet * (info?.mult3 ?? 0);
    return { win, msg: `JACKPOT x${info?.mult3 ?? 0} (${a}${a}${a})` };
  }
  if (a===b || b===c) {
    const sym = b; // middle is shared in adjacent matches
    const info = symInfo(sym);
    const win = bet * (info?.mult2 ?? 0);
    return { win, msg: win>0 ? `MATCH x${info?.mult2 ?? 0} (${sym}${sym})` : "No win" };
  }
  return { win: 0, msg: "No win" };
}

function slotsSpin() {
  if (slots.spinning) return;
  const b = slots.bet;
  if (!Economy.canBet(b)) return slotsRefresh("Not enough balance.");
  Economy.bet(b);
  updateHUD();

  slots.spinning = true;
  slots._lastMsg = "Spinning...";
  SND.slotSpin.play();
  playChip();
  slotsRefresh();

  // animate reels quickly
  let ticks = 18;
  const timer = setInterval(() => {
    // fake while spinning
    const tmp = [
      REEL_STRIPS[0][(Math.random()*REEL_STRIPS[0].length)|0],
      REEL_STRIPS[1][(Math.random()*REEL_STRIPS[1].length)|0],
      REEL_STRIPS[2][(Math.random()*REEL_STRIPS[2].length)|0]
    ];
    slots.last = tmp;
    slotVisuals.forEach(v=>v.drawReels(tmp[0],tmp[1],tmp[2],"SPINNING..."));
    slotsRefresh();
    ticks--;
    if (ticks<=0){
      clearInterval(timer);

      slots.reels[0] = spinOneReel(REEL_STRIPS[0], slots.reels[0]);
      slots.reels[1] = spinOneReel(REEL_STRIPS[1], slots.reels[1]);
      slots.reels[2] = spinOneReel(REEL_STRIPS[2], slots.reels[2]);

      const a = REEL_STRIPS[0][slots.reels[0]];
      const bSym = REEL_STRIPS[1][slots.reels[1]];
      const c = REEL_STRIPS[2][slots.reels[2]];
      slots.last = [a,bSym,c];

      const result = evalSlots(a,bSym,c, b);
      if (result.win > 0) {
        Economy.pay(result.win + b); // return bet + profit (we already removed bet; easiest is pay bet+profit)
        playWin();
        slots._lastMsg = `WIN +$${result.win} profit`;
      } else {
        slots._lastMsg = "Lost.";
      }

      slotVisuals.forEach(v=>v.drawReels(a,bSym,c, result.msg));
      slots.spinning = false;
      slotsRefresh(result.msg);
    }
  }, 60);
}
s$("slotSpin").onclick = ()=>slotsSpin();

// --------------------------------------
// Blackjack UI (real-ish rules + double)
// --------------------------------------
const blackjackUI = document.createElement("div");
blackjackUI.className = "uiWrap";
blackjackUI.innerHTML = `
  <div class="uiCard">
    <div class="uiHead">
      <div class="uiTitle">BLACKJACK</div>
      <button class="uiClose" id="bjClose">Close</button>
    </div>
    <div class="uiBody">
      <div class="uiRow">
        <div class="pill"><div><b>Balance</b></div><div id="bjBal">$0</div></div>
        <div class="pill"><div><b>Bet</b></div><div id="bjBet">$25</div></div>
        <div class="pill"><div><b>Status</b></div><div id="bjStatus">READY</div></div>
      </div>

      <div class="uiRow" style="margin-top:12px;">
        <div class="pill" style="flex:1; min-width:300px;">
          <div><b>Your Hand</b></div>
          <div id="bjPH">—</div>
          <div id="bjPS" style="opacity:.9; margin-top:4px;">Score: —</div>
        </div>
        <div class="pill" style="flex:1; min-width:300px;">
          <div><b>Dealer</b></div>
          <div id="bjDH">—</div>
          <div id="bjDS" style="opacity:.9; margin-top:4px;">Score: —</div>
        </div>
      </div>

      <div class="uiBtns">
        <button class="btn" id="bjDown">Bet -</button>
        <button class="btn" id="bjUp">Bet +</button>
        <button class="btn btnPrimary" id="bjDeal">Deal</button>
        <button class="btn" id="bjHit">Hit</button>
        <button class="btn" id="bjStand">Stand</button>
        <button class="btn" id="bjDouble">Double</button>
      </div>

      <div class="msg" id="bjMsg">Rules: Dealer stands on 17. Blackjack pays 3:2.</div>
    </div>
  </div>
`;
document.body.appendChild(blackjackUI);
UI.wraps.blackjack = blackjackUI;

const b$=(id)=>document.getElementById(id);
document.getElementById("bjClose").onclick = ()=>UI.close("blackjack");

function makeDeck() {
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["♠","♥","♦","♣"];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({
    r, s, label: `${r}${s}`,
    v: (r==="A")?11:(["K","Q","J"].includes(r)?10:Number(r))
  });
  for (let i=deck.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}

function score(hand) {
  let t=hand.reduce((sum,c)=>sum+c.v,0);
  let aces=hand.filter(c=>c.r==="A").length;
  while (t>21 && aces>0){ t-=10; aces--; }
  return t;
}

function bjRefresh(msg) {
  b$("bjBal").textContent = `$${Economy.balance}`;
  b$("bjBet").textContent = `$${blackjack.bet}`;
  b$("bjStatus").textContent = blackjack.phase.toUpperCase();

  b$("bjPH").textContent = blackjack.player.map(c=>c.label).join(" ");
  const dealerShown = blackjack.phase==="player" ? blackjack.dealer.map((c,i)=> i===1 ? "🂠" : c.label) : blackjack.dealer.map(c=>c.label);
  b$("bjDH").textContent = dealerShown.join(" ");

  const ps = blackjack.player.length ? score(blackjack.player) : "—";
  const ds = blackjack.dealer.length ? (blackjack.phase==="player" ? score([blackjack.dealer[0]]) : score(blackjack.dealer)) : "—";
  b$("bjPS").textContent = `Score: ${ps}`;
  b$("bjDS").textContent = `Score: ${ds}`;

  // enable/disable double
  b$("bjDouble").style.opacity = blackjack.canDouble ? "1" : "0.5";

  if (msg) b$("bjMsg").textContent = msg;
  updateHUD();
}

b$("bjUp").onclick = ()=>{ if (blackjack.phase!=="ready") return; blackjack.bet = Economy.clampBet(blackjack.bet+25); playChip(); bjRefresh(); };
b$("bjDown").onclick = ()=>{ if (blackjack.phase!=="ready") return; blackjack.bet = Economy.clampBet(blackjack.bet-25); playChip(); bjRefresh(); };

function bjDeal() {
  if (blackjack.phase!=="ready") return;
  if (!Economy.canBet(blackjack.bet)) return bjRefresh("Not enough balance.");
  Economy.bet(blackjack.bet);
  playChip();

  blackjack.deck = makeDeck();
  blackjack.player = [blackjack.deck.pop(), blackjack.deck.pop()];
  blackjack.dealer = [blackjack.deck.pop(), blackjack.deck.pop()];
  blackjack.phase = "player";
  blackjack.canDouble = true;

  const p = score(blackjack.player);
  const dUp = blackjack.dealer[0];
  const dealerHasBJ = (score(blackjack.dealer)===21);
  const playerHasBJ = (p===21);

  // blackjack resolution
  if (playerHasBJ || dealerHasBJ) {
    blackjack.phase = "dealer";
    const d = score(blackjack.dealer);

    if (playerHasBJ && !dealerHasBJ) {
      // 3:2 payout: you get bet back + 1.5*bet profit => total 2.5*bet
      Economy.pay(Math.floor(blackjack.bet * 2.5));
      playWin();
      bjRefresh("BLACKJACK! Paid 3:2.");
    } else if (dealerHasBJ && !playerHasBJ) {
      bjRefresh(`Dealer blackjack (${dUp.label}). You lose.`);
    } else {
      Economy.pay(blackjack.bet); // push return bet
      bjRefresh("Both blackjack. Push.");
    }
    blackjack.phase = "ready";
    blackjack.canDouble = false;
    return;
  }

  bjRefresh("Your turn: Hit / Stand / Double.");
}
b$("bjDeal").onclick = ()=>bjDeal();

function bjHit() {
  if (blackjack.phase!=="player") return;
  blackjack.player.push(blackjack.deck.pop());
  playChip();
  blackjack.canDouble = false;

  const p = score(blackjack.player);
  if (p > 21) {
    bjRefresh("Bust. Dealer wins.");
    blackjack.phase = "ready";
    return;
  }
  bjRefresh("Hit or Stand?");
}
b$("bjHit").onclick = ()=>bjHit();

function bjStand() {
  if (blackjack.phase!=="player") return;
  blackjack.phase = "dealer";
  blackjack.canDouble = false;

  // dealer stands on 17 (including soft 17)
  while (score(blackjack.dealer) < 17) blackjack.dealer.push(blackjack.deck.pop());

  const p = score(blackjack.player);
  const d = score(blackjack.dealer);

  if (d > 21 || p > d) {
    Economy.pay(blackjack.bet * 2); // return bet + 1x profit
    playWin();
    bjRefresh(`You win! Dealer ${d}. (+$${blackjack.bet})`);
  } else if (p === d) {
    Economy.pay(blackjack.bet);
    bjRefresh(`Push. Dealer ${d}. (Bet returned)`);
  } else {
    bjRefresh(`Dealer wins. Dealer ${d}.`);
  }
  blackjack.phase = "ready";
}
b$("bjStand").onclick = ()=>bjStand();

function bjDouble() {
  if (blackjack.phase !== "player" || !blackjack.canDouble) return;
  if (!Economy.canBet(blackjack.bet)) return bjRefresh("Not enough balance to double.");
  Economy.bet(blackjack.bet);
  blackjack.bet *= 2;
  playChip();

  blackjack.player.push(blackjack.deck.pop());
  blackjack.canDouble = false;

  const p = score(blackjack.player);
  if (p > 21) {
    bjRefresh("Bust after double. Dealer wins.");
    blackjack.phase = "ready";
    return;
  }
  bjStand();
}
b$("bjDouble").onclick = ()=>bjDouble();

// ======================
// Raycast + click interactions
// ======================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function openGame(type) {
  if (type === "roulette") { UI.open("roulette"); rouletteRefresh("Pick a bet type, then SPIN."); }
  if (type === "slots")    { UI.open("slots");    slotsRefresh("Set bet, then SPIN."); }
  if (type === "blackjack"){ UI.open("blackjack"); bjRefresh("Adjust bet, then Deal."); }
}

window.addEventListener("click", (e) => {
  if (!started) return;
  if (anyUIOpen()) return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(interactables, true);
  if (!hits.length) return;

  const obj = hits[0].object;
  const t = obj.userData.type;

  // Special: slot click opens slots UI
  if (t === "slots") { openGame("slots"); return; }
  if (t === "roulette") { openGame("roulette"); return; }
  if (t === "blackjack") { openGame("blackjack"); return; }
});

// ======================
// Roulette settle + result + payouts
// ======================
function finishRoulette() {
  const n = roulette._pendingNumber;
  const col = rouletteColor(n);
  roulette.last = `${n} • ${col}`;
  const win = rouletteWinsNumber(n);
  if (win) {
    const totalReturn = rouletteWinAmount(roulette.bet); // returns bet+profit
    Economy.pay(totalReturn);
    playWin();
    rouletteRefresh(`WIN! Result ${roulette.last}. Paid ${roulettePayout(roulette.betKind)}.`);
  } else {
    rouletteRefresh(`Lost. Result ${roulette.last}.`);
  }
  roulette.spinning = false;
  roulette.settleT = 0;
  updateHUD();
}

// ======================
// 120Hz simulation loop
// - Browsers render at display refresh; we simulate at 120Hz for smooth feel.
// ======================
let simAcc = 0;
const SIM_DT = 1 / 120;

// Simple lightweight physics visuals (roulette ball is purely visual here)
const rouletteBall = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.08 })
);
rouletteBall.castShadow = true;
rouletteBall.position.set(roulette.group.position.x + 3.8, 1.55, roulette.group.position.z);
scene.add(rouletteBall);

let ballAng = 0;
let ballRad = 3.85;

function simStep(dt, t) {
  // movement
  updateMovement(dt);

  // chandeliers tiny sway
  for (const c of chandeliers) {
    c.rotation.y += dt * c.userData.spin * 0.35;
    c.rotation.z = Math.sin(t*0.8 + c.userData.spin) * 0.02;
  }

  // neon pulse
  neonPink.intensity = 150 + Math.sin(t*1.8)*25;
  neonCyan.intensity = 150 + Math.sin(t*1.6 + 1.2)*25;
  neonGold.intensity = 105 + Math.sin(t*1.4 + 2.1)*20;

  // dancers + gamblers idle anim
  for (const p of npcs) {
    const u = p.userData;
    u.t += dt;
    const w = (u.style==="dancer") ? 2.6 : 1.2;
    const a = (u.style==="dancer") ? 0.85 : 0.35;

    u.arm1.rotation.z = Math.sin(u.t*w + u.seed) * a;
    u.arm2.rotation.z = -Math.sin(u.t*w + u.seed) * a;
    u.leg1.rotation.x = Math.sin(u.t*w*0.8 + u.seed) * (a*0.35);
    u.leg2.rotation.x = -Math.sin(u.t*w*0.8 + u.seed) * (a*0.35);

    if (u.style === "dancer") {
      p.position.y = Math.abs(Math.sin(u.t*3.0 + u.seed)) * 0.05;
      p.rotation.y += dt * 0.4;
    } else {
      p.position.y = 0;
      p.rotation.y += Math.sin(u.t*0.8 + u.seed) * 0.001;
    }
  }

  // roulette wheel + ball spin animation
  roulWheel.rotation.y += dt * (roulette.spinning ? 4.8 : 0.35);
  rim.material.emissiveIntensity = 0.85 + Math.sin(t*3.4)*0.10;

  if (roulette.spinning) {
    roulette.settleT -= dt;
    ballAng += dt * 8.0;
    ballRad = approach(ballRad, 3.2, dt * 0.6); // drift inward
    rouletteBall.position.set(
      roulette.group.position.x + Math.cos(ballAng) * ballRad,
      1.55,
      roulette.group.position.z + Math.sin(ballAng) * ballRad
    );

    if (roulette.settleT <= 0) {
      // "land" ball near a pocket position visually
      const n = roulette._pendingNumber;
      const idx = ROULETTE_ORDER.indexOf(n);
      const a = (idx / 37) * Math.PI * 2;
      rouletteBall.position.set(
        roulette.group.position.x + Math.cos(a) * 3.05,
        1.50,
        roulette.group.position.z + Math.sin(a) * 3.05
      );
      finishRoulette();
    }
  } else {
    // idle ball
    ballAng += dt * 0.3;
    rouletteBall.position.set(
      roulette.group.position.x + Math.cos(ballAng) * 3.8,
      1.55,
      roulette.group.position.z + Math.sin(ballAng) * 3.8
    );
  }
}

const clock = new THREE.Clock();

// ======================
// Render loop (rAF)
// ======================
function animate() {
  requestAnimationFrame(animate);

  const frameDt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  simAcc += frameDt;

  // step simulation at 120Hz
  let steps = 0;
  while (simAcc >= SIM_DT && steps < 6) {
    simStep(SIM_DT, t);
    simAcc -= SIM_DT;
    steps++;
  }

  renderer.render(scene, camera);
}
animate();

// ======================
// UI open helpers
// ======================
function rouletteOpen() { UI.open("roulette"); rouletteRefresh("Pick a bet type, then SPIN."); }
function slotsOpen() { UI.open("slots"); slotsRefresh("Set bet, then SPIN."); }
function blackjackOpen() { UI.open("blackjack"); bjRefresh("Adjust bet, then Deal."); }

// Let user click the *actual wheel* to open roulette UI (already set via interactable)
// But also allow wheel click to spin once UI is open (button exists anyway)

// Hook buttons
rouletteUI.querySelector("#roulSpin").addEventListener("click", () => { roulette.spinning = false; rouletteSpin(); });
slotsUI.querySelector("#slotSpin").addEventListener("click", () => slotsSpin());
blackjackUI.querySelector("#bjDeal").addEventListener("click", () => bjDeal());

// ======================
// Resize
// ======================
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
