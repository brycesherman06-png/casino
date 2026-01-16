/* ============================================================
   BELLAGIO / OCEAN'S-11 STYLE CASINO — GAMES FIRST (ONE FILE)
   - Updated: GTA4-inspired visual tuning (warm, high-def, PBR feel)
   - Increased simulation fidelity to 144 Hz (SIM_DT) for smooth physics
   - Higher-res canvas textures (default 1024) for more readable UI
   - Games embedded in floor (no big stands) so they are easier to walk to
   - Interaction now distance-based (more efficient navigation)
   - Tweaked player movement for snappier, more responsive navigation
   ============================================================ */

console.log("Casino main.js loaded ✅ (updated visuals / 144Hz sim)");

/* ---------------------- Error helpers ---------------------- */
window.addEventListener("error", (e) => console.error("JS ERROR:", e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => console.error("PROMISE ERROR:", e.reason));

/* ---------------------- DOM + UI CSS ----------------------- */
const canvas = document.getElementById("c");
const overlay = document.getElementById("overlay");

(function injectCSS(){
  const css = `
    html, body { margin:0; height:100%; overflow:hidden; background:#05040a; }
    #c { width:100vw; height:100vh; display:block; image-rendering: auto; }
    #overlay{
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.72); color:#fff; z-index:9999; cursor:pointer;
      font:900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      user-select:none;
    }
    .hud{
      position:fixed; top:14px; left:14px; z-index:9998;
      background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.12);
      backdrop-filter: blur(6px);
      border-radius:14px; padding:10px 12px;
      color:rgba(255,255,255,.92);
      font:900 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      line-height:1.25;
      max-width: 520px;
    }
    .hudRight{
      left:auto; right:14px; min-width: 180px; text-align:left;
    }
    .uiWrap{
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.50); z-index:9997; backdrop-filter: blur(8px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:#fff;
      opacity: 1;
      transition: opacity .25s ease;
    }
    .uiCard{
      width:min(760px, 92vw);
      border-radius:18px;
      background:rgba(14,12,20,.95);
      border:1px solid rgba(255,255,255,.12);
      box-shadow:0 30px 90px rgba(0,0,0,.60);
      overflow:hidden;
    }
    .uiHead{
      padding:16px 18px;
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(90deg, rgba(255,212,43,.20), rgba(255,255,255,.05));
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
      min-width: 180px;
    }
    .uiBtns{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .btn{
      cursor:pointer; border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.08);
      color:#fff; padding:10px 12px; border-radius:14px;
      font-weight:950;
    }
    .btnPrimary{
      background:linear-gradient(90deg, rgba(255,212,43,.30), rgba(255,255,255,.08));
      border:1px solid rgba(255,255,255,.20);
    }
    .msg{
      margin-top:12px; padding:10px 12px; border-radius:14px;
      background:rgba(0,0,0,.30); border:1px solid rgba(255,255,255,.12);
      color:rgba(255,255,255,.94);
      min-height: 22px;
      line-height: 1.3;
    }
    .prompt{
      position:fixed; left:50%; bottom:18px; transform:translateX(-50%);
      z-index:9996;
      padding:10px 14px; border-radius:999px;
      background:rgba(0,0,0,.38); border:1px solid rgba(255,255,255,.14);
      backdrop-filter: blur(6px);
      color:rgba(255,255,255,.92);
      font:900 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      display:none;
    }
    .fadeOut { opacity: 0 !important; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

const hud = document.createElement("div");
hud.className = "hud";
hud.innerHTML = `
  <div><b>WASD</b> move • <b>Shift</b> sprint • <b>Mouse</b> look • <b>E</b> interact • <b>Esc</b> close UI</div>
  <div>Games-first build: walk up to a game and press <b>E</b>.</div>
`;
document.body.appendChild(hud);

const hudRight = document.createElement("div");
hudRight.className = "hud hudRight";
hudRight.innerHTML = `<div><b>BALANCE</b></div><div id="hudBal">$1000</div>`;
document.body.appendChild(hudRight);
const hudBal = document.getElementById("hudBal");

const prompt = document.createElement("div");
prompt.className = "prompt";
prompt.textContent = "Press E to play";
document.body.appendChild(prompt);

/* ------------------------- Audio --------------------------- */
/* Generated wavs so you don't need files (unchanged) */
function wavDataURIFromMonoFloat(samples, sampleRate = 44100) {
  const n = samples.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = n * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, str) => { for (let i=0;i<str.length;i++) view.setUint8(off+i, str.charCodeAt(i)); };

  writeStr(0,"RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8,"WAVE");
  writeStr(12,"fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36,"data");
  view.setUint32(40, dataSize, true);

  let off=44;
  for (let i=0;i<n;i++){
    let s = Math.max(-1, Math.min(1, samples[i]));
    const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(off, pcm, true);
    off += 2;
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk) bin += String.fromCharCode(...bytes.subarray(i, i+chunk));
  return `data:audio/wav;base64,${btoa(bin)}`;
}
function makeNoise(seconds=1.2, amp=0.10, sr=44100){
  const n = Math.floor(seconds*sr);
  const s = new Float32Array(n);
  let v=0;
  for (let i=0;i<n;i++){
    const r = (Math.random()*2-1)*amp;
    v = v*0.93 + r*0.07;
    s[i]=v;
  }
  return wavDataURIFromMonoFloat(s,sr);
}
function makeTone(freq=440, seconds=0.14, amp=0.20, type="sine", sr=44100){
  const n = Math.floor(seconds*sr);
  const s = new Float32Array(n);
  for (let i=0;i<n;i++){
    const t=i/sr;
    const attack = Math.min(1, i/(0.012*sr));
    const decay = Math.pow(1 - i/n, 2.2);
    const env = attack*decay;
    const ph = 2*Math.PI*freq*t;
    let v=0;
    if (type==="sine") v=Math.sin(ph);
    else if (type==="square") v=Math.sign(Math.sin(ph));
    else v = 2*(t*freq - Math.floor(0.5 + t*freq)); // saw
    s[i]=v*amp*env;
  }
  return wavDataURIFromMonoFloat(s,sr);
}
function makeClick(seconds=0.03, amp=0.95, sr=44100){
  const n = Math.floor(seconds*sr);
  const s = new Float32Array(n);
  for (let i=0;i<n;i++){
    const t=i/n;
    const env = Math.pow(1-t,3);
    s[i]=(Math.random()*2-1)*amp*env;
  }
  return wavDataURIFromMonoFloat(s,sr);
}

const SND = {
  air:   new Howl({ src:[makeNoise(1.3,0.10)], loop:true, volume:0.16 }),
  crowd: new Howl({ src:[makeNoise(1.4,0.08)], loop:true, volume:0.10 }),
  chip:  new Howl({ src:[makeClick(0.03,0.95)], volume:0.55 }),
  spin:  new Howl({ src:[makeTone(170,0.22,0.15,"saw")], volume:0.45 }),
  reel:  new Howl({ src:[makeTone(260,0.16,0.12,"square")], volume:0.45 }),
  win1:  new Howl({ src:[makeTone(523.25,0.14,0.20,"sine")], volume:0.75 }),
  win2:  new Howl({ src:[makeTone(659.25,0.14,0.18,"sine")], volume:0.75 }),
  win3:  new Howl({ src:[makeTone(783.99,0.16,0.16,"sine")], volume:0.75 }),
  loss:  new Howl({ src:[makeTone(120,0.18,0.10,"sine")], volume:0.45 }),
};
function playChip(){ SND.chip.play(); }
function playWin(){ SND.win1.play(); setTimeout(()=>SND.win2.play(),110); setTimeout(()=>SND.win3.play(),220); }

/* ------------------------ Economy -------------------------- */
const Economy = {
  balance: 1000,
  clampBet(b){ return Math.max(5, Math.min(1000, b|0)); },
  canBet(b){ return this.balance >= b; },
  bet(b){ this.balance -= b; },
  pay(x){ this.balance += x; }
};
function updateHUD(){ hudBal.textContent = `$${Economy.balance}`; }
updateHUD();

/* -------------------- THREE Renderer ----------------------- */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
// Allow high pixel density for "high-def" look, clamp to reasonable cap
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06050a);

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.08, 400);
camera.rotation.order = "YXZ";

/* ----------------- Helpers: textures ----------------------- */
/* Default texture size bumped to 1024 for higher-definition canvas textures */
function canvasTex(drawFn, size=1024){
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  drawFn(g,size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

/* ----------------- World: Bellagio-ish --------------------- */
const WORLD = {
  W: 60,
  D: 50,
  H: 9,
};

const wallTex = canvasTex((g,s)=>{
  g.fillStyle="#f3efe7"; g.fillRect(0,0,s,s); // ivory base
  // paneling (tighter, grittier like GTA4 interior trim)
  for (let y=0;y<s;y+=128){
    for (let x=0;x<s;x+=128){
      g.fillStyle = ((x+y)/128)%2 ? "#efe8dd" : "#f7f2ea";
      g.fillRect(x+8,y+10,112,106);
      g.strokeStyle="rgba(0,0,0,0.06)";
      g.lineWidth=4;
      g.strokeRect(x+12,y+14,104,98);
    }
  }
  // subtle vertical texture
  g.fillStyle="rgba(0,0,0,0.03)";
  for (let i=0;i<s;i+=22) g.fillRect(i,0,1,s);
}, 1024);
wallTex.repeat.set(3.2, 1.4);

const carpetTex = canvasTex((g,s)=>{
  g.fillStyle="#54111a"; g.fillRect(0,0,s,s); // slightly deeper burgundy
  // classic pattern
  for (let y=0;y<s;y+=48){
    for (let x=0;x<s;x+=48){
      const on = ((x/48 + y/48) % 2)===0;
      g.fillStyle = on ? "#6a1121" : "#4d0d18";
      g.fillRect(x,y,48,48);
      g.fillStyle="rgba(255,212,43,0.16)"; // gold dots
      g.beginPath(); g.arc(x+24,y+24,3.5,0,Math.PI*2); g.fill();
    }
  }
}, 1024);
carpetTex.repeat.set(6.5, 6.0);

const marbleTex = canvasTex((g,s)=>{
  g.fillStyle="#111116"; g.fillRect(0,0,s,s);
  for (let i=0;i<420;i++){
    g.strokeStyle=`rgba(255,255,255,${0.01 + Math.random()*0.05})`;
    g.lineWidth=1 + Math.random()*2;
    g.beginPath();
    const x=Math.random()*s, y=Math.random()*s;
    g.moveTo(x,y);
    g.bezierCurveTo(
      x+(-100+Math.random()*200), y+(-100+Math.random()*200),
      x+(-100+Math.random()*200), y+(-100+Math.random()*200),
      x+(-160+Math.random()*320), y+(-160+Math.random()*320)
    );
    g.stroke();
  }
  // subtle sheen banding
  g.fillStyle="rgba(255,255,255,0.03)";
  for (let i=0;i<s;i+=64) g.fillRect(0,i,s,10);
}, 1024);
marbleTex.repeat.set(4.0, 4.0);

const goldMat = new THREE.MeshStandardMaterial({ color: 0xb58a2a, roughness: 0.28, metalness: 0.95 });
const ivoryWallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92, metalness: 0.02, side: THREE.BackSide });
const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.98, metalness: 0.0 });
const marbleMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.18, metalness: 0.10 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3b2517, roughness: 0.78, metalness: 0.10 });

/* Room shell */
const room = new THREE.Mesh(
  new THREE.BoxGeometry(WORLD.W, WORLD.H, WORLD.D),
  ivoryWallMat
);
room.position.y = WORLD.H/2;
room.receiveShadow = true;
scene.add(room);

/* Floor zones: marble aisle + carpet areas */
const marbleAisle = new THREE.Mesh(
  new THREE.PlaneGeometry(10, WORLD.D-6),
  marbleMat
);
marbleAisle.rotation.x = -Math.PI/2;
marbleAisle.position.set(0, 0.002, 0);
marbleAisle.receiveShadow = true;
scene.add(marbleAisle);

const carpetLeft = new THREE.Mesh(new THREE.PlaneGeometry((WORLD.W-12)/2, WORLD.D-6), carpetMat);
carpetLeft.rotation.x = -Math.PI/2;
carpetLeft.position.set(-((WORLD.W-12)/4) - 5, 0.001, 0);
carpetLeft.receiveShadow = true;
scene.add(carpetLeft);

const carpetRight = carpetLeft.clone();
carpetRight.position.x *= -1;
scene.add(carpetRight);

/* Ceiling */
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD.W-2, WORLD.D-2),
  new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.96, metalness: 0 })
);
ceiling.rotation.x = Math.PI/2;
ceiling.position.set(0, WORLD.H-0.05, 0);
scene.add(ceiling);

/* Partitions (create spaces) */
function addPartition(x, z, w, h, d){
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color: 0xf1ede5, roughness:0.95, metalness:0.02 })
  );
  m.position.set(x, h/2, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);

  // gold cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w+0.06, 0.08, d+0.06), goldMat);
  cap.position.set(x, h+0.04, z);
  scene.add(cap);
}
addPartition( 0, -8,  10, 1.2, 22); // low partition (separates table area)
addPartition(-20, 6,  10, 1.2, 14);
addPartition( 20, 6,  10, 1.2, 14);

/* Columns */
function addColumn(x,z){
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, WORLD.H-1.2, 18),
    new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness:0.92, metalness:0.02 })
  );
  col.position.set(x, (WORLD.H-1.2)/2 + 0.6, z);
  col.castShadow = col.receiveShadow = true;
  scene.add(col);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 12, 24), goldMat);
  ring.rotation.x = Math.PI/2;
  ring.position.set(x, WORLD.H-1.4, z);
  scene.add(ring);
}
for (let x=-26; x<=26; x+=13){
  addColumn(x, -18);
  addColumn(x,  18);
}

/* Paintings (abstract “classic” – not actual copyrighted art) */
function makePaintingTex(seed){
  let s=seed>>>0;
  const rnd=()=>((s=(s*1664525+1013904223)>>>0) / 4294967296);
  return canvasTex((g,sz)=>{
    g.fillStyle="#1a1714"; g.fillRect(0,0,sz,sz);
    // warm gradients
    const grad = g.createLinearGradient(0,0,sz,sz);
    grad.addColorStop(0, "rgba(181,138,42,0.55)");
    grad.addColorStop(0.5, "rgba(235,230,215,0.18)");
    grad.addColorStop(1, "rgba(120,30,40,0.35)");
    g.fillStyle = grad; g.fillRect(0,0,sz,sz);

    for (let i=0;i<120;i++){
      const x=rnd()*sz, y=rnd()*sz, w=24+rnd()*160, h=12+rnd()*90;
      g.fillStyle=`rgba(${140+rnd()*90|0},${70+rnd()*80|0},${40+rnd()*60|0},${0.08+rnd()*0.20})`;
      g.fillRect(x,y,w,h);
    }
    g.strokeStyle="rgba(0,0,0,0.25)";
    g.lineWidth=10; g.strokeRect(12,12,sz-24,sz-24);
  }, 1024);
}
function addPaintingOnWall(side, x, y, z, label){
  const tex = makePaintingTex((Math.random()*1e9)|0);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.8, 0.08),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.05 })
  );
  frame.position.set(x,y,z);
  frame.castShadow = true;

  if (side==="left"){ frame.rotation.y = Math.PI/2; }
  if (side==="right"){ frame.rotation.y = -Math.PI/2; }
  if (side==="back"){ frame.rotation.y = 0; }
  if (side==="front"){ frame.rotation.y = Math.PI; }

  scene.add(frame);

  const border = new THREE.Mesh(
    new THREE.BoxGeometry(2.74, 1.94, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x3a2a14, roughness: 0.85, metalness: 0.10 })
  );
  border.position.copy(frame.position);
  border.rotation.copy(frame.rotation);
  scene.add(border);

  // sconce light
  const l = new THREE.SpotLight(0xfff2d2, 90, 6, Math.PI/8, 0.6, 1.1);
  const dir = new THREE.Vector3(0,0,1);
  dir.applyEuler(frame.rotation);
  l.position.copy(frame.position).add(dir.clone().multiplyScalar(1.3)).add(new THREE.Vector3(0,0.8,0));
  l.target.position.copy(frame.position);
  scene.add(l, l.target);
}
addPaintingOnWall("left",  -WORLD.W/2 + 0.6, 5.0, -10, "GALLERY");
addPaintingOnWall("right",  WORLD.W/2 - 0.6, 5.0,  10, "GALLERY");
addPaintingOnWall("back",   10, 5.0, -WORLD.D/2 + 0.6, "GALLERY");
addPaintingOnWall("back",  -10, 5.0, -WORLD.D/2 + 0.6, "GALLERY");

/* Chandeliers */
function addChandelier(x,z){
  const g = new THREE.Group();
  g.position.set(x, WORLD.H-1.5, z);
  scene.add(g);

  const metal = new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.35, metalness: 0.75 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.9,12), metal);
  stem.position.y = 0.5;
  g.add(stem);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9,0.08,12,32), goldMat);
  ring.rotation.x = Math.PI/2;
  g.add(ring);

  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c6, emissiveIntensity: 1.3, roughness: 0.2 });
  for (let i=0;i<10;i++){
    const a = i/10*Math.PI*2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 14), bulbMat);
    b.position.set(Math.cos(a)*0.9, -0.05, Math.sin(a)*0.9);
    g.add(b);
  }

  const light = new THREE.PointLight(0xfff2c6, 280, 14, 2);
  light.position.set(0,-0.10,0);
  g.add(light);

  g.userData.spin = 0.15 + Math.random()*0.20;
  return g;
}
const chandeliers = [];
for (let x=-18; x<=18; x+=12){
  for (let z=-12; z<=12; z+=12){
    chandeliers.push(addChandelier(x,z));
  }
}

/* Lighting: tuned for warm GTA4-like interior (soft, contrast, local fills) */
scene.add(new THREE.AmbientLight(0xffffff, 0.06));
scene.add(new THREE.HemisphereLight(0xfff2d2, 0x0e0b0d, 0.16));

const key = new THREE.SpotLight(0xfff2d2, 900, 100, Math.PI/6, 0.5, 1.05);
key.position.set(0, WORLD.H+8, 6);
key.target.position.set(0, 0, -2);
key.castShadow = true;
key.shadow.mapSize.set(2048,2048);
scene.add(key, key.target);

function addCeilingPanel(x,z){
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 3.0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c6, emissiveIntensity: 0.65, roughness: 0.95 })
  );
  panel.rotation.x = Math.PI/2;
  panel.position.set(x, WORLD.H-0.06, z);
  scene.add(panel);

  const l = new THREE.PointLight(0xfff2c6, 160, 10, 2);
  l.position.set(x, WORLD.H-0.55, z);
  scene.add(l);
}
for (let x=-18; x<=18; x+=12){
  addCeilingPanel(x, 16);
  addCeilingPanel(x, -16);
}

/* Subtle golden accent lights near games */
const accentRoulette = new THREE.PointLight(0xffd42b, 120, 10, 2);
accentRoulette.position.set(-18, 2.6, 0);
scene.add(accentRoulette);

const accentSlots = new THREE.PointLight(0xffd42b, 120, 10, 2);
accentSlots.position.set(18, 2.6, 0);
scene.add(accentSlots);

const accentBJ = new THREE.PointLight(0xffd42b, 120, 10, 2);
accentBJ.position.set(0, 2.6, -16);
scene.add(accentBJ);

/* ---------------------- Input & Player --------------------- */
let started=false;
let locked=false;

const keys = { w:false,a:false,s:false,d:false, shift:false, e:false };
document.addEventListener("keydown", (ev)=>{
  if (ev.code==="KeyW") keys.w=true;
  if (ev.code==="KeyA") keys.a=true;
  if (ev.code==="KeyS") keys.s=true;
  if (ev.code==="KeyD") keys.d=true;
  if (ev.code==="ShiftLeft"||ev.code==="ShiftRight") keys.shift=true;
  if (ev.code==="KeyE") keys.e=true;
  if (ev.code==="Escape") UI.closeAll();
});
document.addEventListener("keyup", (ev)=>{
  if (ev.code==="KeyW") keys.w=false;
  if (ev.code==="KeyA") keys.a=false;
  if (ev.code==="KeyS") keys.s=false;
  if (ev.code==="KeyD") keys.d=false;
  if (ev.code==="ShiftLeft"||ev.code==="ShiftRight") keys.shift=false;
  if (ev.code==="KeyE") keys.e=false;
});
document.addEventListener("pointerlockchange", ()=>{
  locked = (document.pointerLockElement === renderer.domElement);
});

let yaw=0, pitch=0;
const pitchLimit = Math.PI/2 - 0.08;
// Sensitivity tuned a little tighter
const MOUSE_SENS = 0.0032;

function canLookMove(){
  return started && locked && !UI.anyOpen() && !CIN.active;
}

document.addEventListener("mousemove", (e)=>{
  if (!canLookMove()) return;
  yaw   -= e.movementX * MOUSE_SENS;
  pitch -= e.movementY * MOUSE_SENS;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  camera.rotation.set(pitch, yaw, 0);
});

const player = {
  pos: new THREE.Vector3(0, 1.75, 20),
  vel: new THREE.Vector3(),
  eye: 1.75,
  // slight increase for snappier navigation
  walk: 5.4,
  sprint: 8.6,
  accel: 30,
  friction: 18
};
camera.position.copy(player.pos);

function approach(cur, target, delta){
  if (cur < target) return Math.min(cur+delta, target);
  return Math.max(cur-delta, target);
}

function updateMovement(dt){
  if (!started || UI.anyOpen() || CIN.active) return;

  const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
  const right = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);

  const ix = (keys.d?1:0) - (keys.a?1:0);
  const iz = (keys.s?1:0) - (keys.w?1:0);

  const input = new THREE.Vector3(ix,0,iz);
  let wish = new THREE.Vector3();
  if (input.lengthSq()>0){
    input.normalize();
    wish.addScaledVector(right, input.x);
    wish.addScaledVector(forward, -input.z);
    wish.normalize();
  }

  const speed = keys.shift ? player.sprint : player.walk;
  const targetVX = wish.x * speed;
  const targetVZ = wish.z * speed;

  player.vel.x = approach(player.vel.x, targetVX, player.accel*dt);
  player.vel.z = approach(player.vel.z, targetVZ, player.accel*dt);

  if (wish.lengthSq()===0){
    player.vel.x = approach(player.vel.x, 0, player.friction*dt);
    player.vel.z = approach(player.vel.z, 0, player.friction*dt);
  }

  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;

  // Bounds inside room (leave 0.8m margin to make navigation feel less constrained)
  const bx = WORLD.W/2 - 0.8;
  const bz = WORLD.D/2 - 0.8;
  player.pos.x = THREE.MathUtils.clamp(player.pos.x, -bx, bx);
  player.pos.z = THREE.MathUtils.clamp(player.pos.z, -bz, bz);

  camera.position.set(player.pos.x, player.eye, player.pos.z);

  // slight fov on sprint
  const moving = player.vel.lengthSq() > 0.25;
  const desiredFov = (keys.shift && moving) ? 74 : 70;
  camera.fov = approach(camera.fov, desiredFov, 12*dt);
  camera.updateProjectionMatrix();
}

/* Start interaction */
overlay.addEventListener("click", ()=>{
  if (!started){
    started=true;
    overlay.style.display="none";
    SND.air.play();
    SND.crowd.play();
  }
  renderer.domElement.requestPointerLock?.();
});

/* ----------------------- UI System ------------------------- */
const UI = {
  state: "none",
  wraps: {},
  open(name){
    this.closeAll();
    this.state = name;
    const w = this.wraps[name];
    if (w){
      w.classList.remove("fadeOut");
      w.style.display="flex";
    }
  },
  close(name){
    const w = this.wraps[name];
    if (w){
      w.style.display="none";
    }
    this.state = "none";
  },
  closeAll(){
    for (const k of Object.keys(this.wraps)){
      this.wraps[k].style.display="none";
      this.wraps[k].classList.remove("fadeOut");
    }
    this.state = "none";
  },
  anyOpen(){ return this.state !== "none"; },
  fadeOutActive(){
    const w = this.wraps[this.state];
    if (!w) return;
    w.classList.add("fadeOut");
  },
  fadeInActive(){
    const w = this.wraps[this.state];
    if (!w) return;
    w.classList.remove("fadeOut");
  }
};

/* ------------------- Cinematic Controller ------------------ */
const CIN = {
  active: false,
  t: 0,
  durIn: 0.75,
  durOut: 0.75,
  fromPos: new THREE.Vector3(),
  fromLook: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLook: new THREE.Vector3(),
  retPos: new THREE.Vector3(),
  retLook: new THREE.Vector3(),
  phase: "none", // in, action, out
  onArrive: null,
  onReturn: null,
  saved: { fov: 70 },
  // a “look target” we lerp for stable camera aiming
  curLook: new THREE.Vector3(0,1.5,0),

  start({toPos, toLook, durIn=0.75, durOut=0.75, onArrive, onReturn}){
    this.active = true;
    this.phase = "in";
    this.t = 0;
    this.durIn = durIn;
    this.durOut = durOut;
    this.onArrive = onArrive || null;
    this.onReturn = onReturn || null;

    // save return camera from current position/look
    this.retPos.copy(camera.position);
    this.retLook.copy(this.curLook);

    this.fromPos.copy(camera.position);
    this.fromLook.copy(this.curLook);
    this.toPos.copy(toPos);
    this.toLook.copy(toLook);

    // save fov
    this.saved.fov = camera.fov;

    // soften fov a hair for “cutscene”
    camera.fov = 66;
    camera.updateProjectionMatrix();

    UI.fadeOutActive();
  },

  update(dt){
    if (!this.active) return;

    if (this.phase === "in"){
      this.t += dt;
      const u = clamp01(this.t / this.durIn);
      const e = easeInOutCubic(u);

      camera.position.lerpVectors(this.fromPos, this.toPos, e);
      this.curLook.lerpVectors(this.fromLook, this.toLook, e);
      camera.lookAt(this.curLook);

      if (u >= 1){
        this.phase = "action";
        this.t = 0;
        if (this.onArrive) this.onArrive();
      }
    } else if (this.phase === "out"){
      this.t += dt;
      const u = clamp01(this.t / this.durOut);
      const e = easeInOutCubic(u);

      camera.position.lerpVectors(this.fromPos, this.toPos, e);
      this.curLook.lerpVectors(this.fromLook, this.toLook, e);
      camera.lookAt(this.curLook);

      if (u >= 1){
        this.active = false;
        this.phase = "none";
        camera.fov = this.saved.fov;
        camera.updateProjectionMatrix();
        UI.fadeInActive();
        if (this.onReturn) this.onReturn();
      }
    } else {
      // action phase: camera held by game animations or still
      camera.lookAt(this.curLook);
    }
  },

  returnToPlayer(){
    this.phase = "out";
    this.t = 0;
    // set from = current
    this.fromPos.copy(camera.position);
    this.fromLook.copy(this.curLook);
    // set to = ret
    this.toPos.copy(this.retPos);
    this.toLook.copy(this.retLook);
  }
};

/* --------------------- Labels / Sprites -------------------- */
function makeLabelSprite(text, accent="#ffd42b"){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d");

  g.fillStyle = "rgba(0,0,0,0.62)";
  g.fillRect(0,0,1024,256);

  g.fillStyle = accent;
  g.fillRect(0,0,1024,12);
  g.fillRect(0,244,1024,12);
  g.fillRect(0,0,12,256);
  g.fillRect(1012,0,12,256);

  g.fillStyle = "rgba(255,255,255,0.12)";
  g.fillRect(24, 32, 976, 8);

  g.fillStyle = "#fff";
  g.font = "1000 112px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 512, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  const mat = new THREE.SpriteMaterial({ map: tex, transparent:true });
  const s = new THREE.Sprite(mat);
  s.scale.set(6.0, 1.5, 1);
  return s;
}

/* ------------------- Interactable system ------------------- */
const interactables = [];
function addInteractable(obj, type, ref){
  obj.userData.interactive = true;
  obj.userData.type = type;
  obj.userData.ref = ref;
  interactables.push(obj);
}

/* ------------------------- FX ------------------------------ */
const FX = {
  items: [],
  chipBurst(pos){
    for (let i=0;i<12;i++){
      const chip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07,0.07,0.02,18),
        new THREE.MeshStandardMaterial({ color: 0xffd42b, roughness:0.35, metalness:0.35, emissive:0x000000 })
      );
      chip.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5)*0.2, 0.25+Math.random()*0.15, (Math.random()-0.5)*0.2));
      chip.rotation.x = Math.PI/2;
      chip.castShadow = true;
      scene.add(chip);

      FX.items.push({
        mesh: chip,
        vel: new THREE.Vector3((Math.random()-0.5)*1.2, 1.2 + Math.random()*1.2, (Math.random()-0.5)*1.2),
        life: 1.6
      });
    }
  },
  winPulse(light){
    if (!light) return;
    light.userData._pulseT = 0.0;
    light.userData._pulseBase = light.intensity;
    light.userData._pulse = true;
  },
  lossDull(light){
    if (!light) return;
    light.userData._dullT = 0.0;
    light.userData._dullBase = light.intensity;
    light.userData._dull = true;
  },
  update(dt){
    // chips physics
    for (let i=FX.items.length-1;i>=0;i--){
      const it = FX.items[i];
      it.life -= dt;
      it.vel.y -= 6.8*dt;
      it.mesh.position.addScaledVector(it.vel, dt);
      it.mesh.rotation.z += dt * 6;
      if (it.mesh.position.y < 0.03){
        it.mesh.position.y = 0.03;
        it.vel.y *= -0.35;
        it.vel.x *= 0.7; it.vel.z *= 0.7;
      }
      if (it.life <= 0){
        scene.remove(it.mesh);
        it.mesh.geometry.dispose?.();
        it.mesh.material.dispose?.();
        FX.items.splice(i,1);
      }
    }

    // light pulses
    scene.traverse((o)=>{
      if (o.isLight && o.userData?._pulse){
        o.userData._pulseT += dt;
        const t = o.userData._pulseT;
        o.intensity = o.userData._pulseBase * (1 + Math.sin(t*14)*0.18) + 18*Math.max(0, 1-t);
        if (t > 0.6){
          o.intensity = o.userData._pulseBase;
          o.userData._pulse = false;
        }
      }
      if (o.isLight && o.userData?._dull){
        o.userData._dullT += dt;
        const t = o.userData._dullT;
        o.intensity = o.userData._dullBase * (1 - 0.22*Math.sin(Math.min(1,t)*Math.PI));
        if (t > 0.35){
          o.intensity = o.userData._dullBase;
          o.userData._dull = false;
        }
      }
    });
  }
};

/* ------------------------ NPC Crowd ------------------------ */
const NPC = {
  list: [],
  zones: {
    roulette: { x:-18, z: 0, r: 4.5 },
    slots:    { x: 18, z: 0, r: 4.5 },
    bj:       { x:  0, z:-16, r: 4.5 },
    aisle:    { x:  0, z: 10, r: 10.0 },
  },
  spawnCount: 14 // slightly reduced for performance and navigation
};

function randBetween(a,b){ return a + Math.random()*(b-a); }

function makeHair(style, color){
  const mat = new THREE.MeshStandardMaterial({ color, roughness:0.75, metalness:0.05 });
  if (style==="short"){
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), mat);
    m.scale.y = 0.55;
    m.position.y = 1.72;
    return m;
  }
  if (style==="long"){
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.35, 6, 10), mat);
    m.position.y = 1.60;
    m.position.z = -0.03;
    return m;
  }
  // tied/ponytail
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), mat);
  cap.scale.y = 0.55;
  cap.position.y = 1.72;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.07,0.25,10), mat);
  tail.position.set(0, 1.58, -0.18);
  tail.rotation.x = Math.PI/5;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), mat);
  tip.position.set(0, 1.45, -0.25);
  g.add(cap, tail, tip);
  return g;
}

function makePerson(){
  const g = new THREE.Group();

  // body variation
  const height = randBetween(1.55, 1.92);
  const shoulders = randBetween(0.32, 0.42);
  const hips = randBetween(0.28, 0.40);
  const torsoThick = randBetween(0.18, 0.26);

  // “attire palette”: classy
  const outfits = [0x141418, 0x2a2a30, 0x3b2517, 0xefe8dd, 0x4d0d18];
  const outfit = outfits[(Math.random()*outfits.length)|0];
  const accent = 0xb58a2a;

  const skinTones = [0xf2c9a0,0xe7b88f,0xd9a77f,0xc98f6f,0xb97b5d];
  const skin = skinTones[(Math.random()*skinTones.length)|0];

  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness:0.65, metalness:0.02 });
  const clothMat = new THREE.MeshStandardMaterial({ color: outfit, roughness:0.75, metalness:0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: accent, roughness:0.35, metalness:0.65 });

  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), skinMat);
  head.position.y = height - 0.15;
  head.castShadow = true;
  g.add(head);

  // neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.10,10), skinMat);
  neck.position.y = height - 0.35;
  g.add(neck);

  // torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(torsoThick, 0.55, 6, 12), clothMat);
  torso.position.y = height - 0.75;
  torso.scale.x = shoulders/0.36;
  torso.castShadow = true;
  g.add(torso);

  // hips
  const hip = new THREE.Mesh(new THREE.BoxGeometry(hips, 0.20, 0.20), clothMat);
  hip.position.y = height - 1.12;
  hip.castShadow = true;
  g.add(hip);

  // arms
  const armMat = new THREE.MeshStandardMaterial({ color: outfit, roughness:0.78, metalness:0.05 });
  const arm1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.42, 6, 10), armMat);
  const arm2 = arm1.clone();
  arm1.position.set(-shoulders, height - 0.80, 0);
  arm2.position.set( shoulders, height - 0.80, 0);
  arm1.castShadow = arm2.castShadow = true;
  g.add(arm1, arm2);

  // legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness:0.85, metalness:0.02 });
  const leg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 6, 10), legMat);
  const leg2 = leg1.clone();
  leg1.position.set(-hips*0.35, 0.55, 0);
  leg2.position.set( hips*0.35, 0.55, 0);
  leg1.castShadow = leg2.castShadow = true;
  g.add(leg1, leg2);

  // shoes
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness:0.85, metalness:0.05 });
  const shoe1 = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.06,0.22), shoeMat);
  const shoe2 = shoe1.clone();
  shoe1.position.set(leg1.position.x, 0.08, 0.04);
  shoe2.position.set(leg2.position.x, 0.08, 0.04);
  g.add(shoe1, shoe2);

  // subtle trim (tie/necklace vibe)
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.20,0.02), trimMat);
  trim.position.set(0, height - 0.58, 0.18);
  g.add(trim);

  // hair
  const hairStyles = ["short","long","tied"];
  const hairStyle = hairStyles[(Math.random()*hairStyles.length)|0];
  const hairColors = [0x181414,0x2a1f18,0x3a2a14,0x4a3a26,0x101010];
  const hairColor = hairColors[(Math.random()*hairColors.length)|0];
  const hair = makeHair(hairStyle, hairColor);
  g.add(hair);

  g.userData = {
    head, torso, arm1, arm2, leg1, leg2,
    height,
    speed: randBetween(0.75, 1.35),
    state: "wander", // wander, idle
    t: Math.random()*10,
    target: new THREE.Vector3(0,0,0),
    radius: randBetween(0.30, 0.42),
    prefer: (["roulette","slots","bj","aisle"][(Math.random()*4)|0]),
    idleTime: 0
  };

  return g;
}

function pickZonePoint(zoneKey){
  const z = NPC.zones[zoneKey];
  const a = Math.random()*Math.PI*2;
  const r = z.r * (0.35 + Math.random()*0.65);
  return new THREE.Vector3(z.x + Math.cos(a)*r, 0, z.z + Math.sin(a)*r);
}

function respawnNPC(n){
  const zone = n.userData.prefer;
  const p = pickZonePoint(zone);
  n.position.set(p.x, 0, p.z);
  n.rotation.y = Math.random()*Math.PI*2;
  n.userData.target.copy(pickZonePoint(zone));
}

function initNPCs(){
  for (let i=0;i<NPC.spawnCount;i++){
    const n = makePerson();
    respawnNPC(n);
    n.traverse((o)=>{ if (o.isMesh){ o.castShadow = true; }});
    scene.add(n);
    NPC.list.push(n);
  }
}
initNPCs();

function updateNPCs(dt){
  const bx = WORLD.W/2 - 1.3;
  const bz = WORLD.D/2 - 1.3;

  for (const n of NPC.list){
    const u = n.userData;
    u.t += dt;

    // animation (walk or idle)
    const walking = (u.state === "wander");
    const w = walking ? 7.5 : 1.8;
    const a = walking ? 0.65 : 0.12;
    u.arm1.rotation.z = Math.sin(u.t*w) * a;
    u.arm2.rotation.z = -Math.sin(u.t*w) * a;
    u.leg1.rotation.x = Math.sin(u.t*w) * a*0.7;
    u.leg2.rotation.x = -Math.sin(u.t*w) * a*0.7;

    if (CIN.active || UI.anyOpen()) continue; // freeze NPCs during cutscene/UI

    if (u.state === "idle"){
      u.idleTime -= dt;
      n.rotation.y += Math.sin(u.t*0.8 + u.height)*0.002;
      if (u.idleTime <= 0){
        u.state = "wander";
        u.target.copy(pickZonePoint(u.prefer));
      }
      continue;
    }

    // wander towards target
    const to = u.target.clone().sub(n.position);
    to.y = 0;
    const dist = to.length();

    if (dist < 0.6){
      u.state = "idle";
      u.idleTime = randBetween(1.0, 3.5);
      continue;
    }

    to.normalize();

    // separation
    const sep = new THREE.Vector3();
    for (const other of NPC.list){
      if (other === n) continue;
      const d = n.position.distanceTo(other.position);
      const min = u.radius + other.userData.radius + 0.18;
      if (d < min){
        const push = n.position.clone().sub(other.position);
        push.y = 0;
        if (push.lengthSq() > 0.0001){
          push.normalize().multiplyScalar((min - d) * 1.6);
          sep.add(push);
        }
      }
    }

    const dir = to.add(sep.multiplyScalar(0.25));
    if (dir.lengthSq() > 0.0001) dir.normalize();

    const sp = u.speed;
    n.position.x += dir.x * sp * dt;
    n.position.z += dir.z * sp * dt;

    // face movement
    const targetYaw = Math.atan2(dir.x, dir.z);
    n.rotation.y = THREE.MathUtils.lerp(n.rotation.y, targetYaw, 6*dt);

    // bounds
    n.position.x = THREE.MathUtils.clamp(n.position.x, -bx, bx);
    n.position.z = THREE.MathUtils.clamp(n.position.z, -bz, bz);
  }
}

/* ---------------------- Game Layout ------------------------ */
const LAYOUT = {
  roulette: new THREE.Vector3(-18, 0,  0),
  slots:    new THREE.Vector3( 18, 0,  0),
  bj:       new THREE.Vector3(  0, 0, -16),
};

function addGameLabel(group, text, accent="#ffd42b"){
  const label = makeLabelSprite(text, accent);
  // labels slightly lower so they don't float awkwardly
  label.position.set(0, 1.7, 0);
  group.add(label);
}

/* ---------------------- Roulette Game ---------------------- */
const Roulette = {
  group: new THREE.Group(),
  wheel: null,
  rimLight: new THREE.PointLight(0xffd42b, 90, 8, 2),
  spinning: false,
  settleT: 0,
  pendingNumber: 0,
  last: null,
  bet: 25,
  betKind: "RED",
  straight: 17,
  uiMsg: "Choose a bet, then Spin.",
  actionInProgress: false
};

// Standard European wheel order for visuals
Roulette.ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
Roulette.RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

Roulette.colorOf = (n)=> n===0 ? "GREEN" : (Roulette.RED.has(n) ? "RED" : "BLACK");

function buildRoulette(){
  Roulette.group.position.copy(LAYOUT.roulette);
  scene.add(Roulette.group);

  // Embedded wheel (no big stand) — sits on a low floor plinth for accessibility
  const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), marbleMat);
  basePlinth.position.y = 0.03;
  Roulette.group.add(basePlinth);

  // Wheel texture (higher-res)
  const wheelTex = canvasTex((g,s)=>{
    g.fillStyle="#111116"; g.fillRect(0,0,s,s);
    const cx=s/2, cy=s/2;
    const wedges=37;
    for (let i=0;i<wedges;i++){
      const a0 = (i/wedges)*Math.PI*2;
      const a1 = ((i+1)/wedges)*Math.PI*2;
      const n = Roulette.ORDER[i];
      g.beginPath(); g.moveTo(cx,cy); g.arc(cx,cy,s*0.47,a0,a1); g.closePath();
      const col = Roulette.colorOf(n);
      g.fillStyle = col==="RED" ? "#b01822" : col==="BLACK" ? "#1a1a20" : "#1aa85b";
      g.fill();

      const mid=(a0+a1)/2;
      const tx=cx + Math.cos(mid)*s*0.37;
      const ty=cy + Math.sin(mid)*s*0.37;
      g.fillStyle="rgba(255,255,255,0.92)";
      g.fillRect((tx|0), (ty|0), 2, 2);
    }
    // center
    g.fillStyle="#e8e2d5";
    g.beginPath(); g.arc(cx,cy,s*0.08,0,Math.PI*2); g.fill();
    g.fillStyle="#b58a2a";
    g.beginPath(); g.arc(cx,cy,s*0.04,0,Math.PI*2); g.fill();
    // subtle wear
    g.fillStyle="rgba(255,255,255,0.02)";
    g.beginPath(); g.ellipse(cx, cy, s*0.35, s*0.35, 0, 0, Math.PI*2); g.fill();
  }, 1024);
  wheelTex.repeat.set(1,1);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.06, 64),
    new THREE.MeshStandardMaterial({ map: wheelTex, roughness:0.32, metalness:0.18 })
  );
  // lowered so it's easy to step up to — wheel top at about 0.38m
  wheel.position.y = 0.38;
  wheel.castShadow = wheel.receiveShadow = true;
  Roulette.group.add(wheel);
  Roulette.wheel = wheel;

  // slim gold rim (not big)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.02, 12, 64), goldMat);
  rim.rotation.x = Math.PI/2;
  rim.position.y = 0.405;
  Roulette.group.add(rim);

  // Ball (visual)
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness:0.22, metalness:0.08 })
  );
  ball.castShadow = true;
  ball.position.set(0.55, 0.41, 0);
  Roulette.group.add(ball);
  Roulette.ball = ball;
  Roulette.ballAng = 0;
  Roulette.ballRad = 0.55;

  // low-profile layout board: flat console beside wheel, readable
  const layoutTex = canvasTex((g,s)=>{
    g.fillStyle="#0f5e3a"; g.fillRect(0,0,s,s);
    g.strokeStyle="rgba(255,255,255,0.65)";
    g.lineWidth=6;
    g.strokeRect(18,18,s-36,s-36);

    g.font="1000 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.fillStyle="rgba(255,255,255,0.92)";
    g.fillText("ROULETTE", 36, 72);

    g.font="900 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.fillStyle="rgba(255,255,255,0.85)";
    g.fillText("RED / BLACK", 36, 122);
    g.fillText("EVEN / ODD", 36, 156);
    g.fillText("1-18 / 19-36", 36, 190);
    g.fillText("DOZENS", 36, 224);
    g.fillText("STRAIGHT", 36, 258);

    // accents
    g.fillStyle="rgba(181,138,42,0.55)";
    g.fillRect(18, s-42, s-36, 24);
  }, 1024);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.8),
    new THREE.MeshStandardMaterial({ map: layoutTex, roughness:0.6, metalness:0.05, side: THREE.DoubleSide })
  );
  // place the board low and flat to the side; it's accessible and not a big upright frame
  board.rotation.x = -Math.PI/2;
  board.position.set(0.85, 0.04, 0.0);
  Roulette.group.add(board);

  // Label
  addGameLabel(Roulette.group, "ROULETTE", "#ffd42b");

  // Interactable: register the wheel mesh and the board (so players can interact at floor level)
  addInteractable(wheel, "roulette", Roulette);
  addInteractable(board, "roulette", Roulette);

  // rim light
  Roulette.rimLight.position.set(LAYOUT.roulette.x, 1.3, LAYOUT.roulette.z);
  scene.add(Roulette.rimLight);
}
buildRoulette();

/* Roulette rules (unchanged) */
function roulettePayout(kind){
  if (kind === "STRAIGHT") return 35;
  if (kind.startsWith("DOZEN")) return 2;
  return 1;
}
function rouletteWins(kind, n, straight){
  const col = Roulette.colorOf(n);
  if (kind==="RED") return col==="RED";
  if (kind==="BLACK") return col==="BLACK";
  if (kind==="EVEN") return n!==0 && n%2===0;
  if (kind==="ODD") return n!==0 && n%2===1;
  if (kind==="LOW") return n>=1 && n<=18;
  if (kind==="HIGH") return n>=19 && n<=36;
  if (kind==="DOZEN1") return n>=1 && n<=12;
  if (kind==="DOZEN2") return n>=13 && n<=24;
  if (kind==="DOZEN3") return n>=25 && n<=36;
  if (kind==="STRAIGHT") return n===straight;
  return false;
}

/* ------------------------ Slots Game ----------------------- */
const Slots = {
  group: new THREE.Group(),
  bet: 10,
  spinning: false,
  last: null,
  uiMsg: "Set bet, then Spin.",
  light: new THREE.PointLight(0xffd42b, 90, 8, 2),
  reelStrips: [],
  reelIndex: [0,0,0],
  screen: null,
};

Slots.SYMBOLS = [
  { s:"7",  w: 2,  m3: 30, m2: 6 },
  { s:"♦",  w: 3,  m3: 15, m2: 4 },
  { s:"★",  w: 5,  m3: 12, m2: 4 },
  { s:"🔔", w: 6,  m3: 10, m2: 3 },
  { s:"🍒", w: 9,  m3: 6,  m2: 2 },
  { s:"🍋", w: 10, m3: 5,  m2: 2 },
  { s:"🍇", w: 12, m3: 4,  m2: 1 }
];

function makeStrip(){
  const strip=[];
  for (const it of Slots.SYMBOLS){
    for (let i=0;i<it.w;i++) strip.push(it.s);
  }
  // shuffle
  for (let i=strip.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    [strip[i],strip[j]]=[strip[j],strip[i]];
  }
  return strip;
}
function symInfo(s){ return Slots.SYMBOLS.find(x=>x.s===s); }

function buildSlots(){
  Slots.group.position.copy(LAYOUT.slots);
  scene.add(Slots.group);

  // Machines now sit on the floor accessible like real slot cabinets (no large bank)
  const machineMat = new THREE.MeshStandardMaterial({ color: 0x16161c, roughness:0.55, metalness:0.15 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xb58a2a, roughness:0.35, metalness:0.75 });
  const emiss = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, emissive:0xffd42b, emissiveIntensity:0.12, roughness:0.45 });

  const positions = [-1.05, 0, 1.05];
  const machines = [];

  // Screen (bigger readability, above machines but lower overall)
  const sc = document.createElement("canvas");
  sc.width=1536; sc.height=512;
  const sg = sc.getContext("2d");
  const tex = new THREE.CanvasTexture(sc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  const screenMat = new THREE.MeshStandardMaterial({ map: tex, emissive:0xffd42b, emissiveIntensity:0.08, roughness:0.45, metalness:0.05 });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.05), screenMat);
  screenMesh.position.set(0, 1.62, 0.61);
  Slots.group.add(screenMesh);

  Slots.screen = { canvas: sc, ctx: sg, tex, mesh: screenMesh };

  function drawSlots(a,b,c,msg){
    const g=sg;
    g.clearRect(0,0,1536,512);
    g.fillStyle="rgba(0,0,0,0.75)"; g.fillRect(0,0,1536,512);

    const grad=g.createLinearGradient(0,0,1536,0);
    grad.addColorStop(0,"rgba(181,138,42,0.45)");
    grad.addColorStop(1,"rgba(255,255,255,0.06)");
    g.fillStyle=grad; g.fillRect(0,0,1536,24);

    // windows
    g.strokeStyle="rgba(255,255,255,0.18)";
    g.lineWidth=8;
    const w=360,h=260;
    const xs=[150, 588, 1026];
    for (let i=0;i<3;i++){
      g.fillStyle="rgba(255,255,255,0.06)";
      g.fillRect(xs[i], 92, w, h);
      g.strokeRect(xs[i], 92, w, h);
    }

    // symbols
    g.fillStyle="rgba(255,255,255,0.92)";
    g.font="1000 178px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillText(a, xs[0]+w/2, 222);
    g.fillText(b, xs[1]+w/2, 222);
    g.fillText(c, xs[2]+w/2, 222);

    g.fillStyle="rgba(255,255,255,0.90)";
    g.font="900 46px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.textAlign="left";
    g.fillText(msg||"PRESS SPIN", 36, 462);

    tex.needsUpdate=true;
  }

  // cabinets (floor-mounted)
  for (let i=0;i<3;i++){
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.22, 0.68), machineMat);
    cab.position.set(positions[i], 0.61, -0.05);
    cab.castShadow = cab.receiveShadow = true;
    Slots.group.add(cab);

    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.28, 0.06), trim);
    bezel.position.set(positions[i], 0.69, 0.33);
    Slots.group.add(bezel);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.14, 0.10), emiss);
    panel.position.set(positions[i], 0.32, 0.34);
    Slots.group.add(panel);

    // “spin” button for interaction (reachable)
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07,0.07,0.03,18),
      new THREE.MeshStandardMaterial({ color:0x101012, emissive:0xffd42b, emissiveIntensity:0.18, roughness:0.45 })
    );
    btn.rotation.x = Math.PI/2;
    btn.position.set(positions[i]+0.24, 0.32, 0.40);
    Slots.group.add(btn);

    machines.push({ cab, btn });
  }

  drawSlots("🍒","🔔","7","PRESS SPIN");

  addGameLabel(Slots.group, "SLOTS", "#ffd42b");

  // Interactable: any button opens Slots UI
  for (const m of machines) addInteractable(m.btn, "slots", Slots);

  Slots.light.position.set(LAYOUT.slots.x, 1.6, LAYOUT.slots.z);
  scene.add(Slots.light);

  // strips
  Slots.reelStrips = [makeStrip(), makeStrip(), makeStrip()];
  Slots.draw = drawSlots;
}
buildSlots();

function evalSlots(a,b,c, bet){
  if (a===b && b===c){
    const info = symInfo(a);
    const profit = bet * (info?.m3 ?? 0);
    return { profit, msg: `3 MATCH x${info?.m3 ?? 0}` };
  }
  if (a===b || b===c){
    const sym = b; // middle
    const info = symInfo(sym);
    const profit = bet * (info?.m2 ?? 0);
    return { profit, msg: profit>0 ? `2 MATCH x${info?.m2 ?? 0}` : "No win" };
  }
  return { profit: 0, msg:"No win" };
}

/* --------------------- Blackjack Game ---------------------- */
const Blackjack = {
  group: new THREE.Group(),
  bet: 25,
  phase: "ready",
  deck: [],
  player: [],
  dealer: [],
  canDouble: false,
  uiMsg: "Adjust bet, then Deal.",
  light: new THREE.PointLight(0xffd42b, 90, 8, 2),
  cardMeshes: { player: [], dealer: [] }
};

function buildBlackjack(){
  Blackjack.group.position.copy(LAYOUT.bj);
  scene.add(Blackjack.group);

  // Table: lowered height (integrated, easier access)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.46, 1.15),
    woodMat
  );
  base.position.y = 0.23;
  base.castShadow = base.receiveShadow = true;
  Blackjack.group.add(base);

  // Felt top
  const feltTex = canvasTex((g,s)=>{
    g.fillStyle="#0f5e3a"; g.fillRect(0,0,s,s);
    g.strokeStyle="rgba(255,255,255,0.45)";
    g.lineWidth=10;
    g.strokeRect(26,26,s-52,s-52);

    g.fillStyle="rgba(255,255,255,0.85)";
    g.font="1000 54px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.fillText("BLACKJACK", 44, 96);

    g.font="900 30px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.fillText("BLACKJACK PAYS 3 TO 2", 44, 150);

    // betting circles
    g.strokeStyle="rgba(181,138,42,0.60)";
    g.lineWidth=10;
    const cx=s*0.50, cy=s*0.62;
    for (let i=-1;i<=1;i++){
      g.beginPath();
      g.arc(cx + i*s*0.18, cy, s*0.09, 0, Math.PI*2);
      g.stroke();
    }
  }, 1024);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.18, 0.04, 1.08),
    new THREE.MeshStandardMaterial({ map: feltTex, roughness:0.78, metalness:0.02, emissive:0x001a08, emissiveIntensity:0.10 })
  );
  top.position.y = 0.46;
  top.castShadow = top.receiveShadow = true;
  Blackjack.group.add(top);

  // Dealer “chip tray” prop
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.04, 0.18),
    new THREE.MeshStandardMaterial({ color:0x1a1a1f, roughness:0.65, metalness:0.10 })
  );
  tray.position.set(0, 0.48, -0.43);
  Blackjack.group.add(tray);

  addGameLabel(Blackjack.group, "BLACKJACK", "#ffd42b");

  addInteractable(top, "blackjack", Blackjack);

  Blackjack.light.position.set(LAYOUT.bj.x, 1.6, LAYOUT.bj.z);
  scene.add(Blackjack.light);

  // create placeholder card planes for visibility
  function makeCardPlane(){
    const c = document.createElement("canvas");
    c.width=512; c.height=712;
    const g=c.getContext("2d");
    g.fillStyle="#f7f2ea"; g.fillRect(0,0,512,712);
    g.fillStyle="#b01822"; g.fillRect(20,20,472,672);
    g.fillStyle="rgba(255,255,255,0.75)";
    for (let i=0;i<8;i++) g.fillRect(32+i*56, 60, 20, 20);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness:0.5, metalness:0.05 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.20), m);
    p.rotation.x = -Math.PI/2;
    p.castShadow = true;
    p.visible = false;
    return { plane:p, canvas:c, ctx:g, tex };
  }
  for (let i=0;i<5;i++){
    const pc = makeCardPlane();
    pc.plane.position.set(-0.30 + i*0.15, 0.48, 0.10);
    Blackjack.group.add(pc.plane);
    Blackjack.cardMeshes.player.push(pc);

    const dc = makeCardPlane();
    dc.plane.position.set(-0.30 + i*0.15, 0.48, -0.15);
    Blackjack.group.add(dc.plane);
    Blackjack.cardMeshes.dealer.push(dc);
  }
}
buildBlackjack();

function makeDeck(){
  const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits=["♠","♥","♦","♣"];
  const deck=[];
  for (const s of suits){
    for (const r of ranks){
      deck.push({
        r, s,
        label:`${r}${s}`,
        v:(r==="A")?11:(["K","Q","J"].includes(r)?10:Number(r))
      });
    }
  }
  for (let i=deck.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}
function score(hand){
  let t=hand.reduce((sum,c)=>sum+c.v,0);
  let aces=hand.filter(c=>c.r==="A").length;
  while (t>21 && aces>0){ t-=10; aces--; }
  return t;
}
function drawCardCanvas(cardCanvasObj, card, faceDown=false){
  const g = cardCanvasObj.ctx;
  g.clearRect(0,0,512,712);

  // card base
  g.fillStyle="#f7f2ea"; g.fillRect(0,0,512,712);
  g.strokeStyle="rgba(0,0,0,0.20)";
  g.lineWidth=6;
  g.strokeRect(16,16,480,680);

  if (faceDown){
    g.fillStyle="#b01822"; g.fillRect(32,32,448,648);
    g.fillStyle="rgba(255,255,255,0.75)";
    for (let i=0;i<10;i++) g.fillRect(40+i*44, 72, 20, 20);
    cardCanvasObj.tex.needsUpdate=true;
    return;
  }

  const isRed = (card.s==="♥" || card.s==="♦");
  g.fillStyle = isRed ? "#b01822" : "#101012";
  g.font="1000 120px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.fillText(card.r, 32, 120);
  g.fillText(card.s, 32, 200);

  g.font="1000 260px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.textAlign="center";
  g.textBaseline="middle";
  g.fillText(card.s, 256, 352);

  g.textAlign="left";
  cardCanvasObj.tex.needsUpdate=true;
}

/* ---------------------- Game UIs --------------------------- */
function makeUI(name, title){
  const wrap = document.createElement("div");
  wrap.className="uiWrap";
  wrap.innerHTML = `
    <div class="uiCard">
      <div class="uiHead">
        <div class="uiTitle">${title}</div>
        <button class="uiClose" id="${name}_close">Close</button>
      </div>
      <div class="uiBody" id="${name}_body"></div>
    </div>
  `;
  document.body.appendChild(wrap);
  UI.wraps[name]=wrap;
  wrap.querySelector(`#${name}_close`).onclick = ()=>UI.close(name);
  return wrap.querySelector(`#${name}_body`);
}

/* Roulette UI */
const rBody = makeUI("roulette","ROULETTE (EUROPEAN 0–36)");
rBody.innerHTML = `
  <div class="uiRow">
    <div class="pill"><div><b>Balance</b></div><div id="r_bal">$0</div></div>
    <div class="pill"><div><b>Bet</b></div><div id="r_bet">$25</div></div>
    <div class="pill"><div><b>Type</b></div><div id="r_type">RED</div></div>
  </div>

  <div class="uiRow" style="margin-top:12px;">
    <div class="pill" style="flex:1; min-width:280px;">
      <div><b>Last</b></div>
      <div id="r_last">—</div>
    </div>
    <div class="pill" style="flex:1; min-width:280px;">
      <div><b>Payout</b></div>
      <div id="r_pay">1:1</div>
    </div>
  </div>

  <div class="uiBtns">
    <button class="btn" id="r_down">Bet -</button>
    <button class="btn" id="r_up">Bet +</button>
    <button class="btn" id="r_kind">Change Bet</button>
    <button class="btn" id="r_pick" style="display:none;">Pick #</button>
    <button class="btn btnPrimary" id="r_spin">SPIN</button>
  </div>
  <div class="msg" id="r_msg"></div>
`;

const R_KINDS = ["RED","BLACK","EVEN","ODD","LOW","HIGH","DOZEN1","DOZEN2","DOZEN3","STRAIGHT"];
function rouletteKindText(){
  if (Roulette.betKind==="STRAIGHT") return `STRAIGHT (${Roulette.straight})`;
  if (Roulette.betKind==="DOZEN1") return "DOZEN (1–12)";
  if (Roulette.betKind==="DOZEN2") return "DOZEN (13–24)";
  if (Roulette.betKind==="DOZEN3") return "DOZEN (25–36)";
  return Roulette.betKind;
}
function roulettePayText(){
  const p = roulettePayout(Roulette.betKind);
  return p===35 ? "35:1" : p===2 ? "2:1" : "1:1";
}
function rouletteRefresh(msg){
  document.getElementById("r_bal").textContent = `$${Economy.balance}`;
  document.getElementById("r_bet").textContent = `$${Roulette.bet}`;
  document.getElementById("r_type").textContent = rouletteKindText();
  document.getElementById("r_pay").textContent = roulettePayText();
  document.getElementById("r_last").textContent = Roulette.last ?? "—";
  const pick = document.getElementById("r_pick");
  pick.style.display = (Roulette.betKind==="STRAIGHT") ? "inline-block" : "none";
  document.getElementById("r_msg").textContent = msg ?? Roulette.uiMsg;
  updateHUD();
}

document.getElementById("r_up").onclick = ()=>{ if (Roulette.actionInProgress) return; Roulette.bet = Economy.clampBet(Roulette.bet+10); playChip(); rouletteRefresh(); };
document.getElementById("r_down").onclick = ()=>{ if (Roulette.actionInProgress) return; Roulette.bet = Economy.clampBet(Roulette.bet-10); playChip(); rouletteRefresh(); };
document.getElementById("r_kind").onclick = ()=>{
  if (Roulette.actionInProgress) return;
  const i = R_KINDS.indexOf(Roulette.betKind);
  Roulette.betKind = R_KINDS[(i+1)%R_KINDS.length];
  playChip();
  rouletteRefresh();
};
document.getElementById("r_pick").onclick = ()=>{
  if (Roulette.actionInProgress) return;
  const n = prompt("Pick a number (0–36):", String(Roulette.straight));
  const v = Math.max(0, Math.min(36, parseInt(n??"",10)));
  if (!Number.isNaN(v)) Roulette.straight = v;
  playChip();
  rouletteRefresh();
};

/* Slots UI */
const sBody = makeUI("slots","SLOTS (3-REEL)");
sBody.innerHTML = `
  <div class="uiRow">
    <div class="pill"><div><b>Balance</b></div><div id="s_bal">$0</div></div>
    <div class="pill"><div><b>Bet</b></div><div id="s_bet">$10</div></div>
    <div class="pill"><div><b>Last</b></div><div id="s_last">—</div></div>
  </div>
  <div class="pill" style="margin-top:12px;">
    <div><b>Payline</b></div>
    <div id="s_line" style="font-weight:1000; font-size:34px; letter-spacing:3px;">— — —</div>
  </div>
  <div class="uiBtns">
    <button class="btn" id="s_down">Bet -</button>
    <button class="btn" id="s_up">Bet +</button>
    <button class="btn btnPrimary" id="s_spin">SPIN</button>
  </div>
  <div class="msg" id="s_msg"></div>
`;
function slotsRefresh(msg){
  document.getElementById("s_bal").textContent = `$${Economy.balance}`;
  document.getElementById("s_bet").textContent = `$${Slots.bet}`;
  document.getElementById("s_line").textContent = Slots.last ? Slots.last.join(" ") : "— — —";
  document.getElementById("s_last").textContent = Slots.last ? Slots.last.join("") : "—";
  document.getElementById("s_msg").textContent = msg ?? Slots.uiMsg;
  updateHUD();
}
document.getElementById("s_up").onclick = ()=>{ if (Slots.spinning) return; Slots.bet = Economy.clampBet(Slots.bet+5); playChip(); slotsRefresh(); };
document.getElementById("s_down").onclick = ()=>{ if (Slots.spinning) return; Slots.bet = Economy.clampBet(Slots.bet-5); playChip(); slotsRefresh(); };

/* Blackjack UI */
const bBody = makeUI("blackjack","BLACKJACK");
bBody.innerHTML = `
  <div class="uiRow">
    <div class="pill"><div><b>Balance</b></div><div id="b_bal">$0</div></div>
    <div class="pill"><div><b>Bet</b></div><div id="b_bet">$25</div></div>
    <div class="pill"><div><b>Status</b></div><div id="b_stat">READY</div></div>
  </div>

  <div class="uiRow" style="margin-top:12px;">
    <div class="pill" style="flex:1; min-width:300px;">
      <div><b>Your Hand</b></div>
      <div id="b_ph">—</div>
      <div id="b_ps" style="opacity:.9; margin-top:4px;">Score: —</div>
    </div>
    <div class="pill" style="flex:1; min-width:300px;">
      <div><b>Dealer</b></div>
      <div id="b_dh">—</div>
      <div id="b_ds" style="opacity:.9; margin-top:4px;">Score: —</div>
    </div>
  </div>

  <div class="uiBtns">
    <button class="btn" id="b_down">Bet -</button>
    <button class="btn" id="b_up">Bet +</button>
    <button class="btn btnPrimary" id="b_deal">DEAL</button>
    <button class="btn" id="b_hit">HIT</button>
    <button class="btn" id="b_stand">STAND</button>
    <button class="btn" id="b_double">DOUBLE</button>
  </div>

  <div class="msg" id="b_msg"></div>
`;
function bjRefresh(msg){
  document.getElementById("b_bal").textContent = `$${Economy.balance}`;
  document.getElementById("b_bet").textContent = `$${Blackjack.bet}`;
  document.getElementById("b_stat").textContent = Blackjack.phase.toUpperCase();

  document.getElementById("b_ph").textContent = Blackjack.player.map(c=>c.label).join(" ");
  const dealerShown = (Blackjack.phase==="player")
    ? Blackjack.dealer.map((c,i)=> i===1 ? "🂠" : c.label)
    : Blackjack.dealer.map(c=>c.label);
  document.getElementById("b_dh").textContent = dealerShown.join(" ");

  const ps = Blackjack.player.length ? score(Blackjack.player) : "—";
  const ds = Blackjack.dealer.length ? (Blackjack.phase==="player" ? score([Blackjack.dealer[0]]) : score(Blackjack.dealer)) : "—";
  document.getElementById("b_ps").textContent = `Score: ${ps}`;
  document.getElementById("b_ds").textContent = `Score: ${ds}`;

  document.getElementById("b_double").style.opacity = Blackjack.canDouble ? "1" : "0.5";
  document.getElementById("b_msg").textContent = msg ?? Blackjack.uiMsg;

  updateHUD();
}
document.getElementById("b_up").onclick = ()=>{ if (Blackjack.phase!=="ready") return; Blackjack.bet = Economy.clampBet(Blackjack.bet+25); playChip(); bjRefresh(); };
document.getElementById("b_down").onclick = ()=>{ if (Blackjack.phase!=="ready") return; Blackjack.bet = Economy.clampBet(Blackjack.bet-25); playChip(); bjRefresh(); };

/* ------------------ Interaction (distance + raycast) -------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentHover = null;
const INTERACT_RANGE = 3.2; // players can interact from a small distance; improved navigation

function raycastCenter(){
  // primary raycast still used for precision (center)
  mouse.x = 0;
  mouse.y = 0;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactables, true);
  return hits.length ? hits[0].object : null;
}

function findNearbyInteractable(){
  // faster friendly alternative: check proximity to each interactable's world position
  const camPos = camera.position;
  let best = null;
  let bestDist = Infinity;
  for (const obj of interactables){
    // compute an approximate world position: prefer top-level parent position if available
    let worldPos = new THREE.Vector3();
    // try to get a bounding center if available
    obj.getWorldPosition(worldPos);
    const d = camPos.distanceTo(worldPos);
    if (d < INTERACT_RANGE && d < bestDist){
      bestDist = d;
      best = obj;
    }
  }
  return best;
}

function showPrompt(show, text="Press E to play"){
  if (show){
    prompt.textContent = text;
    prompt.style.display = "block";
  } else {
    prompt.style.display = "none";
  }
}

function openGame(type){
  if (type==="roulette"){ UI.open("roulette"); rouletteRefresh(); }
  if (type==="slots"){ UI.open("slots"); slotsRefresh(); }
  if (type==="blackjack"){ UI.open("blackjack"); bjRefresh(); }
}

function handleInteract(){
  if (!started || UI.anyOpen() || CIN.active) return;

  // prefer a nearby object to enable easy navigation (you don't need to perfectly aim)
  const nearby = findNearbyInteractable();
  const rayObj = raycastCenter();

  const obj = nearby || rayObj;
  if (!obj || !obj.userData.interactive) return;
  openGame(obj.userData.type);
}

document.addEventListener("keydown", (ev)=>{
  if (ev.code==="KeyE"){
    handleInteract();
  }
});

/* ------------------ Cinematic presets per game ------------- */
const CAM = {
  rouletteAction(){
    const base = LAYOUT.roulette;
    return {
      pos: new THREE.Vector3(base.x + 1.8, 1.85, base.z + 2.2),
      look: new THREE.Vector3(base.x + 0.0, 1.05, base.z + 0.0)
    };
  },
  slotsAction(){
    const base = LAYOUT.slots;
    return {
      pos: new THREE.Vector3(base.x + 0.0, 1.65, base.z + 2.3),
      look: new THREE.Vector3(base.x + 0.0, 1.35, base.z + 0.35)
    };
  },
  bjAction(){
    const base = LAYOUT.bj;
    return {
      pos: new THREE.Vector3(base.x + 0.0, 1.75, base.z + 2.2),
      look: new THREE.Vector3(base.x + 0.0, 0.85, base.z + 0.05)
    };
  }
};

/* ------------------ Action Pipeline (best practice) -------- */
async function runCinematicAction({ uiName, camPresetFn, actionFn, onDoneMsgFn }){
  if (CIN.active) return;
  const preset = camPresetFn();
  const prevState = UI.state;

  return new Promise((resolve)=>{
    CIN.start({
      toPos: preset.pos,
      toLook: preset.look,
      durIn: 0.7,
      durOut: 0.7,
      onArrive: async ()=>{
        try{
          await actionFn();
        } finally {
          CIN.returnToPlayer();
        }
      },
      onReturn: ()=>{
        if (UI.state === prevState){
          UI.fadeInActive();
          if (onDoneMsgFn) onDoneMsgFn();
        }
        resolve();
      }
    });
  });
}

/* ------------------ Roulette Action (spin) ----------------- */
async function rouletteSpinAction(){
  if (Roulette.actionInProgress) return;
  const b = Roulette.bet;
  if (!Economy.canBet(b)){
    rouletteRefresh("Not enough balance.");
    return;
  }

  Roulette.actionInProgress = true;
  Economy.bet(b);
  updateHUD();
  playChip();
  SND.spin.play();

  Roulette.pendingNumber = (Math.random()*37)|0;
  Roulette.settleT = 2.4;
  Roulette.spinning = true;

  await new Promise((res)=>{
    Roulette._resolve = res;
  });

  Roulette.actionInProgress = false;
}

function finishRoulette(){
  const n = Roulette.pendingNumber;
  const col = Roulette.colorOf(n);
  Roulette.last = `${n} • ${col}`;

  const win = rouletteWins(Roulette.betKind, n, Roulette.straight);
  if (win){
    const payout = roulettePayout(Roulette.betKind);
    const profit = Roulette.bet * payout;
    Economy.pay(Roulette.bet + profit);
    playWin();
    FX.winPulse(Roulette.rimLight);
    FX.chipBurst(Roulette.group.localToWorld(new THREE.Vector3(0,0.6,0)));
    rouletteRefresh(`WIN! Result ${Roulette.last}. Profit +$${profit}.`);
  } else {
    SND.loss.play();
    FX.lossDull(Roulette.rimLight);
    rouletteRefresh(`Lost. Result ${Roulette.last}.`);
  }
  updateHUD();
}

/* ------------------ Slots Action (spin) -------------------- */
async function slotsSpinAction(){
  if (Slots.spinning) return;
  const b = Slots.bet;
  if (!Economy.canBet(b)){
    slotsRefresh("Not enough balance.");
    return;
  }

  Slots.spinning = true;
  Economy.bet(b);
  updateHUD();
  playChip();
  SND.reel.play();

  // spin animation: show random quickly, then settle to strip indices
  let ticks = 18;
  await new Promise((resolve)=>{
    const tick = ()=>{
      // spinning visuals
      const tmp = [
        Slots.reelStrips[0][(Math.random()*Slots.reelStrips[0].length)|0],
        Slots.reelStrips[1][(Math.random()*Slots.reelStrips[1].length)|0],
        Slots.reelStrips[2][(Math.random()*Slots.reelStrips[2].length)|0]
      ];
      Slots.draw(tmp[0],tmp[1],tmp[2],"SPINNING...");
      Slots.last = tmp;

      ticks--;
      if (ticks<=0){
        resolve();
      } else {
        setTimeout(tick, 55);
      }
    };
    tick();
  });

  // settle reel indices (advance)
  const step = ()=> 12 + ((Math.random()*18)|0);
  Slots.reelIndex[0] = (Slots.reelIndex[0] + step()) % Slots.reelStrips[0].length;
  Slots.reelIndex[1] = (Slots.reelIndex[1] + step()) % Slots.reelStrips[1].length;
  Slots.reelIndex[2] = (Slots.reelIndex[2] + step()) % Slots.reelStrips[2].length;

  const a = Slots.reelStrips[0][Slots.reelIndex[0]];
  const bb = Slots.reelStrips[1][Slots.reelIndex[1]];
  const c = Slots.reelStrips[2][Slots.reelIndex[2]];
  Slots.last = [a,bb,c];

  const result = evalSlots(a,bb,c,b);
  if (result.profit > 0){
    Economy.pay(b + result.profit);
    playWin();
    FX.winPulse(Slots.light);
    FX.chipBurst(Slots.group.localToWorld(new THREE.Vector3(0,0.9,0.6)));
    Slots.draw(a,bb,c,`${result.msg} • Profit +$${result.profit}`);
    slotsRefresh(`${result.msg} • Profit +$${result.profit}`);
  } else {
    SND.loss.play();
    FX.lossDull(Slots.light);
    Slots.draw(a,bb,c,"NO WIN");
    slotsRefresh("No win.");
  }

  updateHUD();
  Slots.spinning = false;
}

/* ------------------ Blackjack Actions ---------------------- */
function bjResetInWorldCards(){
  for (const c of Blackjack.cardMeshes.player) c.plane.visible = false;
  for (const c of Blackjack.cardMeshes.dealer) c.plane.visible = false;
}

function bjShowHandsInWorld(faceDownDealerSecond=true){
  bjResetInWorldCards();

  // player cards
  for (let i=0;i<Blackjack.player.length && i<Blackjack.cardMeshes.player.length;i++){
    const slot = Blackjack.cardMeshes.player[i];
    drawCardCanvas(slot, Blackjack.player[i], false);
    slot.plane.visible = true;
    slot.plane.position.x = -0.30 + i*0.15;
    slot.plane.position.z = 0.10 + i*0.01;
  }

  // dealer cards
  for (let i=0;i<Blackjack.dealer.length && i<Blackjack.cardMeshes.dealer.length;i++){
    const slot = Blackjack.cardMeshes.dealer[i];
    const facedown = faceDownDealerSecond && (Blackjack.phase==="player") && i===1;
    drawCardCanvas(slot, Blackjack.dealer[i], facedown);
    slot.plane.visible = true;
    slot.plane.position.x = -0.30 + i*0.15;
    slot.plane.position.z = -0.15 + i*0.01;
  }
}

async function bjDealAction(){
  if (Blackjack.phase !== "ready") return;
  if (!Economy.canBet(Blackjack.bet)){
    bjRefresh("Not enough balance.");
    return;
  }

  Economy.bet(Blackjack.bet);
  playChip();
  updateHUD();

  Blackjack.deck = makeDeck();
  Blackjack.player = [Blackjack.deck.pop(), Blackjack.deck.pop()];
  Blackjack.dealer = [Blackjack.deck.pop(), Blackjack.deck.pop()];
  Blackjack.phase = "player";
  Blackjack.canDouble = true;

  bjShowHandsInWorld(true);
  bjRefresh("Your turn: Hit / Stand / Double.");

  const p = score(Blackjack.player);
  const d = score(Blackjack.dealer);
  const playerBJ = (p === 21);
  const dealerBJ = (d === 21);

  if (playerBJ || dealerBJ){
    Blackjack.phase = "dealer";
    bjShowHandsInWorld(false);

    if (playerBJ && !dealerBJ){
      Economy.pay(Math.floor(Blackjack.bet * 2.5));
      playWin();
      FX.winPulse(Blackjack.light);
      bjRefresh("BLACKJACK! Paid 3:2.");
    } else if (dealerBJ && !playerBJ){
      SND.loss.play();
      FX.lossDull(Blackjack.light);
      bjRefresh("Dealer blackjack. You lose.");
    } else {
      Economy.pay(Blackjack.bet);
      bjRefresh("Both blackjack. Push.");
    }
    Blackjack.phase = "ready";
    Blackjack.canDouble = false;
    updateHUD();
  }
}

function bjHit(){
  if (Blackjack.phase!=="player") return;
  Blackjack.player.push(Blackjack.deck.pop());
  Blackjack.canDouble = false;
  playChip();
  bjShowHandsInWorld(true);

  const p = score(Blackjack.player);
  if (p > 21){
    SND.loss.play();
    FX.lossDull(Blackjack.light);
    bjRefresh("Bust. You lose.");
    Blackjack.phase = "ready";
    Blackjack.canDouble = false;
    updateHUD();
    return;
  }
  bjRefresh("Hit or Stand?");
}

function bjStand(){
  if (Blackjack.phase!=="player") return;
  Blackjack.phase = "dealer";
  Blackjack.canDouble = false;

  while (score(Blackjack.dealer) < 17){
    Blackjack.dealer.push(Blackjack.deck.pop());
  }

  bjShowHandsInWorld(false);

  const p = score(Blackjack.player);
  const d = score(Blackjack.dealer);

  if (d > 21 || p > d){
    Economy.pay(Blackjack.bet*2);
    playWin();
    FX.winPulse(Blackjack.light);
    FX.chipBurst(Blackjack.group.localToWorld(new THREE.Vector3(0,0.6,0.05)));
    bjRefresh(`You win! Dealer ${d}. (+$${Blackjack.bet})`);
  } else if (p === d){
    Economy.pay(Blackjack.bet);
    bjRefresh(`Push. Dealer ${d}. (Bet returned)`);
  } else {
    SND.loss.play();
    FX.lossDull(Blackjack.light);
    bjRefresh(`Dealer wins. Dealer ${d}.`);
  }

  Blackjack.phase = "ready";
  updateHUD();
}

function bjDouble(){
  if (Blackjack.phase!=="player" || !Blackjack.canDouble) return;
  if (!Economy.canBet(Blackjack.bet)){
    bjRefresh("Not enough balance to double.");
    return;
  }

  Economy.bet(Blackjack.bet);
  Blackjack.bet *= 2;
  playChip();

  Blackjack.player.push(Blackjack.deck.pop());
  Blackjack.canDouble = false;
  bjShowHandsInWorld(true);

  const p = score(Blackjack.player);
  if (p > 21){
    SND.loss.play();
    FX.lossDull(Blackjack.light);
    bjRefresh("Bust after double. You lose.");
    Blackjack.phase="ready";
    updateHUD();
    return;
  }
  bjStand();
}

/* Hook UI buttons to cinematic actions */
document.getElementById("r_spin").onclick = async ()=>{
  if (Roulette.actionInProgress) return;
  await runCinematicAction({
    uiName: "roulette",
    camPresetFn: CAM.rouletteAction,
    actionFn: rouletteSpinAction,
    onDoneMsgFn: ()=> rouletteRefresh()
  });
};
document.getElementById("s_spin").onclick = async ()=>{
  if (Slots.spinning) return;
  await runCinematicAction({
    uiName: "slots",
    camPresetFn: CAM.slotsAction,
    actionFn: slotsSpinAction,
    onDoneMsgFn: ()=> slotsRefresh()
  });
};
document.getElementById("b_deal").onclick = async ()=>{
  await runCinematicAction({
    uiName: "blackjack",
    camPresetFn: CAM.bjAction,
    actionFn: bjDealAction,
    onDoneMsgFn: ()=> bjRefresh()
  });
};
document.getElementById("b_hit").onclick = ()=>bjHit();
document.getElementById("b_stand").onclick = ()=>bjStand();
document.getElementById("b_double").onclick = ()=>bjDouble();

/* ---------------------- Hover prompt ----------------------- */
function updateHoverPrompt(){
  if (!started || UI.anyOpen() || CIN.active || !locked){
    showPrompt(false);
    return;
  }

  // prefer nearby interactable (distance-based) — much easier to navigate without pixel-perfect aim
  const nearby = findNearbyInteractable();
  if (nearby && nearby.userData.interactive){
    showPrompt(true, "Press E to play");
    currentHover = nearby;
    return;
  }

  // fallback to center raycast for precise targets
  const obj = raycastCenter();
  if (obj && obj.userData.interactive){
    showPrompt(true, "Press E to play");
    currentHover = obj;
  } else {
    showPrompt(false);
    currentHover = null;
  }
}

/* ---------------------- Roulette animation ----------------- */
function updateRoulette(dt){
  if (Roulette.wheel) Roulette.wheel.rotation.y += dt * (Roulette.spinning ? 6.0 : 0.25);

  if (!Roulette.spinning) {
    Roulette.ballAng += dt * 0.35;
    Roulette.ballRad = 0.55;
    Roulette.ball.position.set(Math.cos(Roulette.ballAng)*Roulette.ballRad, 0.41, Math.sin(Roulette.ballAng)*Roulette.ballRad);
    return;
  }

  Roulette.settleT -= dt;
  Roulette.ballAng += dt * 10.0;
  Roulette.ballRad = approach(Roulette.ballRad, 0.40, dt * 0.18);
  Roulette.ball.position.set(Math.cos(Roulette.ballAng)*Roulette.ballRad, 0.41, Math.sin(Roulette.ballAng)*Roulette.ballRad);

  if (Roulette.settleT <= 0){
    const n = Roulette.pendingNumber;
    const idx = Roulette.ORDER.indexOf(n);
    const a = (idx/37)*Math.PI*2;
    Roulette.ball.position.set(Math.cos(a)*0.40, 0.41, Math.sin(a)*0.40);

    Roulette.spinning = false;
    finishRoulette();

    if (Roulette._resolve){
      const r = Roulette._resolve;
      Roulette._resolve = null;
      r();
    }
  }
}

/* ---------------------- World polish updates ---------------- */
function updateWorld(dt, t){
  for (const c of chandeliers){
    c.rotation.y += dt * c.userData.spin * 0.38;
    c.rotation.z = Math.sin(t*0.8 + c.userData.spin)*0.02;
  }
  accentRoulette.intensity = 120 + Math.sin(t*1.3)*12;
  accentSlots.intensity = 120 + Math.sin(t*1.2 + 1.2)*12;
  accentBJ.intensity = 120 + Math.sin(t*1.1 + 2.0)*12;
}

/* ---------------------- Main loop (144Hz sim) -------------- */
const clock = new THREE.Clock();
let acc = 0;
// Target simulation Hz: 144 for very smooth internal updates
const SIM_DT = 1/144;

function simStep(dt, t){
  updateMovement(dt);
  updateNPCs(dt);
  updateRoulette(dt);
  FX.update(dt);
  CIN.update(dt);
  updateWorld(dt, t);
  updateHoverPrompt();
}

function animate(){
  requestAnimationFrame(animate);

  const frameDt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  acc += frameDt;

  // allow up to a few sim steps per frame to keep sim stable on variable framerates
  let steps=0;
  while (acc >= SIM_DT && steps < 12){
    simStep(SIM_DT, t);
    acc -= SIM_DT;
    steps++;
  }

  renderer.render(scene, camera);
}
animate();

/* ---------------------- Resize ------------------------------ */
addEventListener("resize", ()=>{
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});
