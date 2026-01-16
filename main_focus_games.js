/* ============================================================
   CASINO - Games-Focused, Performance-First Entry Script
   - Purpose: a lean, game-first rewrite based on main.js
   - Goals:
     * Make the three games (Roulette, Slots, Blackjack) the core experience.
     * Reduce roaming and background crowd simulation.
     * Make game objects proportional to player height.
     * Improve clarity (big labels, clean UIs) and input ergonomics.
     * Cut costly features (mass NPCs, heavy shadows, many lights).
     * Keep code modular and easily pluggable as drop-in to index.html.
   - Usage: include after three/howler in index.html:
       <script src="main_focus_games.js"></script>
   ============================================================ */

(() => {
  // Basic config / tuning
  const PLAYER_EYE = 1.75;
  const SIM_HZ = 90;                // internal simulation tick
  const SIM_DT = 1 / SIM_HZ;
  const TEX_SIZE = 512;             // smaller textures for speed (512 is crisp enough)
  const RENDER_PIXEL_RATIO_CAP = Math.min(window.devicePixelRatio || 1, 1.5);
  const INTERACT_RANGE = 3.0;       // easy interaction distance
  const LABEL_SCALE = 3.2;          // game label sprite scale

  // Safety: ensure THREE and Howl are present
  if (typeof THREE === "undefined") {
    console.error("Three.js not found. Please include three.min.js before this script.");
    return;
  }
  if (typeof Howl === "undefined") {
    console.warn("Howler not found. Sounds will be silent (optional).");
  }

  /* ------------------------ Renderer ------------------------ */
  const canvas = document.getElementById("c");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(RENDER_PIXEL_RATIO_CAP);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false; // disable shadows for performance & clarity

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060a);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.08, 400);
  camera.position.set(0, PLAYER_EYE, 6);
  camera.rotation.order = "YXZ";

  /* ------------------------ Lighting ------------------------ */
  // Minimal, warm lighting to hint environment without cost
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff2d2, 0.6);
  key.position.set(1, 2, 1);
  scene.add(key);

  /* ---------------------- Utility funcs --------------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function canvasTexture(drawFn, size = TEX_SIZE) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    drawFn(g, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function makeLabelSprite(text, accent = "#ffd42b") {
    const size = TEX_SIZE;
    const tex = canvasTexture((g, s) => {
      g.fillStyle = "rgba(0,0,0,0.6)";
      g.fillRect(0, 0, s, s / 4);
      g.fillStyle = accent;
      g.fillRect(0, 0, s, 8);
      g.fillStyle = "#fff";
      g.font = `900 ${Math.floor(s / 9)}px system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, s / 2, s / 8);
    }, size);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(LABEL_SCALE, LABEL_SCALE * 0.28, 1);
    return spr;
  }

  /* -------------------- Minimal Environment ----------------- */
  (function buildRoom() {
    // floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0e0d10, roughness: 0.98 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // subtle back wall for contrast
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x141215, roughness: 0.95 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    wall.position.set(0, 5, -14);
    scene.add(wall);

    // Simple UI hint
    const hud = document.createElement("div");
    hud.style.position = "fixed";
    hud.style.left = "12px";
    hud.style.top = "12px";
    hud.style.padding = "8px 10px";
    hud.style.background = "rgba(0,0,0,0.45)";
    hud.style.color = "#fff";
    hud.style.font = "700 13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    hud.style.borderRadius = "10px";
    hud.innerHTML = `<div style="line-height:1.2">Press <b>E</b> to interact • <b>Tab</b> to toggle focus UI</div>`;
    document.body.appendChild(hud);
  })();

  /* ---------------------- Player control -------------------- */
  let started = false;
  let locked = false;
  const keys = { w: false, a: false, s: false, d: false, shift: false };
  let yaw = 0, pitch = 0;
  const MOUSE_SENS = 0.0030;
  const player = {
    pos: new THREE.Vector3(0, PLAYER_EYE, 6),
    vel: new THREE.Vector3(),
    walk: 4.2,
    sprint: 7.0,
    accel: 24,
    friction: 16
  };
  camera.position.copy(player.pos);

  document.addEventListener("keydown", (ev) => {
    if (ev.code === "KeyW") keys.w = true;
    if (ev.code === "KeyA") keys.a = true;
    if (ev.code === "KeyS") keys.s = true;
    if (ev.code === "KeyD") keys.d = true;
    if (ev.code === "ShiftLeft" || ev.code === "ShiftRight") keys.shift = true;
    if (ev.code === "KeyE") handleInteract();
    if (ev.code === "Tab") { ev.preventDefault(); toggleUiFocus(); }
  });
  document.addEventListener("keyup", (ev) => {
    if (ev.code === "KeyW") keys.w = false;
    if (ev.code === "KeyA") keys.a = false;
    if (ev.code === "KeyS") keys.s = false;
    if (ev.code === "KeyD") keys.d = false;
    if (ev.code === "ShiftLeft" || ev.code === "ShiftRight") keys.shift = false;
  });
  document.addEventListener("pointerlockchange", () => {
    locked = (document.pointerLockElement === renderer.domElement);
  });
  document.addEventListener("mousemove", (e) => {
    if (!locked) return;
    yaw -= e.movementX * MOUSE_SENS;
    pitch -= e.movementY * MOUSE_SENS;
    const limit = Math.PI / 2 - 0.1;
    pitch = clamp(pitch, -limit, limit);
    camera.rotation.set(pitch, yaw, 0);
  });

  function updateMovement(dt) {
    // Simplified: small navigation only; encourage staying near games
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

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
    const targetX = wish.x * speed;
    const targetZ = wish.z * speed;

    player.vel.x = approach(player.vel.x, targetX, player.accel * dt);
    player.vel.z = approach(player.vel.z, targetZ, player.accel * dt);

    if (wish.lengthSq() === 0) {
      player.vel.x = approach(player.vel.x, 0, player.friction * dt);
      player.vel.z = approach(player.vel.z, 0, player.friction * dt);
    }

    player.pos.x += player.vel.x * dt;
    player.pos.z += player.vel.z * dt;
    camera.position.set(player.pos.x, player.pos.y, player.pos.z);
  }

  function approach(cur, tgt, delta) {
    if (cur < tgt) return Math.min(cur + delta, tgt);
    return Math.max(cur - delta, tgt);
  }

  /* ------------------------ Audio -------------------------- */
  function makeClick() {
    if (typeof Howl === "undefined") return null;
    const data = (function() {
      const n = 4410;
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) s[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) * 0.9;
      return s;
    })();
    // very small helper to create wav dataURI
    function wavFromFloat(samples, sr = 44100) {
      const n = samples.length;
      const buffer = new ArrayBuffer(44 + n * 2);
      const view = new DataView(buffer);
      let offset = 0;
      function writeStr(s) { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); }
      writeStr("RIFF"); view.setUint32(offset, 36 + n * 2, true); offset += 4;
      writeStr("WAVEfmt "); view.setUint32(offset, 16, true); offset += 4;
      view.setUint16(offset, 1, true); offset += 2; view.setUint16(offset, 1, true); offset += 2;
      view.setUint32(offset, sr, true); offset += 4; view.setUint32(offset, sr * 2, true); offset += 4;
      view.setUint16(offset, 2, true); offset += 2; view.setUint16(offset, 16, true); offset += 2;
      writeStr("data"); view.setUint32(offset, n * 2, true); offset += 4;
      for (let i = 0; i < n; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
      let bin = "";
      const bytes = new Uint8Array(buffer);
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      return "data:audio/wav;base64," + btoa(bin);
    }
    return new Howl({ src: [wavFromFloat(data)], volume: 0.55 });
  }
  const CLICK_SND = makeClick();
  function playClick() { CLICK_SND && CLICK_SND.play(); }

  /* ----------------------- Game Core ----------------------- */
  // We'll create a compact games manager that holds the 3 games with simple UIs.
  const Games = { list: [], labels: [] };

  // Reusable materials
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xb58a2a, roughness: 0.28, metalness: 0.95 });
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x0f5e3a, roughness: 0.95, metalness: 0.02 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.95, metalness: 0.02 });

  // Helper to create a low-profile, player-proportioned table
  function makeTable(width, depth, height = 0.92) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), feltMat);
    top.position.y = height;
    g.add(top);
    const base = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.18, depth * 0.9), darkMat);
    base.position.y = height - 0.14;
    g.add(base);
    return g;
  }

  // Build Roulette (proportion: wheel diameter ~ 0.8 * player eye height scale)
  (function buildRoulette() {
    const group = new THREE.Group();
    group.position.set(-6, 0, 0);

    // Table 1.6 x 1.6, wheel ~0.9m diameter
    const table = makeTable(1.6, 1.6, 0.92);
    group.add(table);

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 48);
    const wheelTex = canvasTexture((g, s) => {
      g.fillStyle = "#0f0f11";
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#b01822";
      // simple numbered wedges
      const wedges = 12;
      for (let i = 0; i < wedges; i++) {
        const a0 = (i / wedges) * Math.PI * 2;
        g.beginPath();
        g.moveTo(s / 2, s / 2);
        g.arc(s / 2, s / 2, s / 2 - 6, a0, a0 + (Math.PI * 2 / wedges));
        g.closePath();
        g.fillStyle = i % 2 ? "#b01822" : "#111214";
        g.fill();
      }
    }, 512);
    const wheelMat = new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.35, metalness: 0.12 });
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.y = 0.98;
    group.add(wheel);

    // ball indicator
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf4f1ea }));
    ball.position.set(0.48, 1.02, 0);
    group.add(ball);

    // label
    const label = makeLabelSprite("ROULETTE");
    label.position.set(0, 1.75, 0.0);
    group.add(label);

    // interactive area (in-world)
    group.userData = {
      type: "roulette",
      wheel,
      ball,
      spin: false,
      settle: 0,
      pending: null,
      bet: 25,
      last: null
    };

    scene.add(group);
    Games.list.push(group);
    Games.labels.push(label);
  })();

  // Build Slots (three reels style)
  (function buildSlots() {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const table = makeTable(2.2, 1.0, 0.92);
    group.add(table);

    // screen as single canvas texture (for clarity)
    const screenW = 512, screenH = 180;
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = screenW; screenCanvas.height = screenH;
    const sg = screenCanvas.getContext("2d");
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.needsUpdate = true;
    const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0x111111, emissiveIntensity: 0.06 });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), screenMat);
    screenMesh.position.set(0, 1.35, 0.4);
    group.add(screenMesh);

    function drawScreen(a, b, c, msg) {
      sg.clearRect(0, 0, screenW, screenH);
      sg.fillStyle = "#050506"; sg.fillRect(0, 0, screenW, screenH);
      sg.fillStyle = "#ffd42b"; sg.fillRect(0, 8, screenW, 12);
      sg.font = "700 68px system-ui";
      sg.fillStyle = "#fff";
      sg.textAlign = "center";
      sg.fillText(a, screenW * 0.20, screenH * 0.6);
      sg.fillText(b, screenW * 0.5, screenH * 0.6);
      sg.fillText(c, screenW * 0.80, screenH * 0.6);
      sg.font = "500 18px system-ui"; sg.textAlign = "left";
      sg.fillText(msg || "PRESS SPIN", 12, screenH - 12);
      screenTex.needsUpdate = true;
    }
    drawScreen("🍒", "🔔", "7", "PRESS SPIN");

    const label = makeLabelSprite("SLOTS");
    label.position.set(0, 1.75, 0);
    group.add(label);

    group.userData = {
      type: "slots",
      screenDraw: drawScreen,
      spinning: false,
      last: null,
      bet: 10
    };

    scene.add(group);
    Games.list.push(group);
    Games.labels.push(label);
  })();

  // Build Blackjack (table-oriented)
  (function buildBlackjack() {
    const group = new THREE.Group();
    group.position.set(6, 0, 0);

    const table = makeTable(2.4, 1.2, 0.92);
    group.add(table);

    // dealer & player card placeholders (canvas textures)
    function makeCardCanvas() {
      const c = document.createElement("canvas");
      c.width = 256; c.height = 360;
      return c;
    }
    const playerCardCanvas = [makeCardCanvas(), makeCardCanvas(), makeCardCanvas(), makeCardCanvas(), makeCardCanvas()];
    const playerCardTex = playerCardCanvas.map(c => new THREE.CanvasTexture(c));
    const cardPlanes = playerCardTex.map((tex, i) => {
      const mat = new THREE.MeshStandardMaterial({ map: tex });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.20), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(-0.35 + i * 0.15, 0.95, 0.1);
      plane.visible = false;
      group.add(plane);
      return { plane, tex, canvas: playerCardCanvas[i] };
    });

    function drawCard(cardCanvasObj, label, faceDown = false) {
      const g = cardCanvasObj.getContext("2d");
      g.clearRect(0, 0, cardCanvasObj.width, cardCanvasObj.height);
      g.fillStyle = "#f7f2ea"; g.fillRect(0, 0, cardCanvasObj.width, cardCanvasObj.height);
      g.fillStyle = faceDown ? "#b01822" : "#101012";
      g.font = "bold 48px system-ui";
      g.fillText(faceDown ? "🂠" : label, 24, 80);
      // mark needsUpdate on corresponding three texture later
    }

    // simple UI label
    const label = makeLabelSprite("BLACKJACK");
    label.position.set(0, 1.75, 0);
    group.add(label);

    group.userData = {
      type: "blackjack",
      cardPlanes,
      bet: 25,
      playerHand: [],
      dealerHand: [],
      phase: "ready"
    };

    scene.add(group);
    Games.list.push(group);
    Games.labels.push(label);
  })();

  /* ---------------- Interaction/Proximity helpers ------------- */
  // flatten world positions for distance checks
  function worldDistance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  function findNearbyGame() {
    let best = null;
    let bestDist = Infinity;
    for (const g of Games.list) {
      const wp = new THREE.Vector3();
      g.getWorldPosition(wp);
      const d = worldDistance2D(camera.position, wp);
      if (d < INTERACT_RANGE && d < bestDist) {
        bestDist = d;
        best = g;
      }
    }
    return best;
  }

  // simple, prominent HTML UI overlay for game interaction
  const uiRoot = document.createElement("div");
  uiRoot.style.position = "fixed";
  uiRoot.style.left = "0";
  uiRoot.style.top = "0";
  uiRoot.style.right = "0";
  uiRoot.style.bottom = "0";
  uiRoot.style.display = "none";
  uiRoot.style.alignItems = "center";
  uiRoot.style.justifyContent = "center";
  uiRoot.style.zIndex = 9999;
  uiRoot.style.pointerEvents = "none";
  document.body.appendChild(uiRoot);

  const uiCard = document.createElement("div");
  uiCard.style.pointerEvents = "auto";
  uiCard.style.minWidth = "420px";
  uiCard.style.maxWidth = "92vw";
  uiCard.style.background = "rgba(10,10,12,0.95)";
  uiCard.style.border = "1px solid rgba(255,255,255,0.08)";
  uiCard.style.borderRadius = "12px";
  uiCard.style.padding = "14px";
  uiCard.style.color = "#fff";
  uiCard.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
  uiCard.style.display = "flex";
  uiCard.style.flexDirection = "column";
  uiCard.style.gap = "8px";
  uiRoot.appendChild(uiCard);

  const uiTitle = document.createElement("div");
  uiTitle.style.fontWeight = "900";
  uiTitle.style.fontSize = "18px";
  uiCard.appendChild(uiTitle);

  const uiMsg = document.createElement("div");
  uiMsg.style.opacity = "0.92";
  uiCard.appendChild(uiMsg);

  const uiBtns = document.createElement("div");
  uiBtns.style.display = "flex";
  uiBtns.style.gap = "8px";
  uiCard.appendChild(uiBtns);

  function openUiForGame(game) {
    // populate UI depending on game type
    uiRoot.style.display = "flex";
    uiTitle.textContent = (game.userData && game.userData.type ? game.userData.type.toUpperCase() : "GAME");
    uiBtns.innerHTML = "";
    uiMsg.textContent = "";
    if (game.userData.type === "roulette") {
      const spinBtn = makeButton("SPIN", () => startRouletteSpin(game));
      const betMinus = makeButton("-BET", () => { game.userData.bet = Math.max(5, game.userData.bet - 10); updateUi(); });
      const betPlus = makeButton("+BET", () => { game.userData.bet = Math.min(1000, game.userData.bet + 10); updateUi(); });
      uiBtns.appendChild(betMinus); uiBtns.appendChild(spinBtn); uiBtns.appendChild(betPlus);
      uiMsg.textContent = `Bet: $${game.userData.bet} • Last: ${game.userData.last ?? "—"}`;
    } else if (game.userData.type === "slots") {
      const spinBtn = makeButton("SPIN", () => spinSlots(game));
      const betMinus = makeButton("-BET", () => { game.userData.bet = Math.max(5, game.userData.bet - 5); updateUi(); });
      const betPlus = makeButton("+BET", () => { game.userData.bet = Math.min(1000, game.userData.bet + 5); updateUi(); });
      uiBtns.appendChild(betMinus); uiBtns.appendChild(spinBtn); uiBtns.appendChild(betPlus);
      uiMsg.textContent = `Bet: $${game.userData.bet} • Last: ${game.userData.last ? game.userData.last.join(" ") : "—"}`;
    } else if (game.userData.type === "blackjack") {
      const dealBtn = makeButton("DEAL", () => dealBlackjack(game));
      const hitBtn = makeButton("HIT", () => bjHit(game));
      const standBtn = makeButton("STAND", () => bjStand(game));
      uiBtns.appendChild(dealBtn); uiBtns.appendChild(hitBtn); uiBtns.appendChild(standBtn);
      uiMsg.textContent = `Bet: $${game.userData.bet} • Phase: ${game.userData.phase}`;
    }
    function updateUi() {
      if (game.userData.type === "roulette") uiMsg.textContent = `Bet: $${game.userData.bet} • Last: ${game.userData.last ?? "—"}`;
      if (game.userData.type === "slots") uiMsg.textContent = `Bet: $${game.userData.bet} • Last: ${game.userData.last ? game.userData.last.join(" ") : "—"}`;
      if (game.userData.type === "blackjack") uiMsg.textContent = `Bet: $${game.userData.bet} • Phase: ${game.userData.phase}`;
    }
  }

  function closeUi() {
    uiRoot.style.display = "none";
  }

  function makeButton(text, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.padding = "10px 12px";
    b.style.borderRadius = "10px";
    b.style.border = "1px solid rgba(255,255,255,0.08)";
    b.style.background = "rgba(255,255,255,0.04)";
    b.style.color = "#fff";
    b.style.fontWeight = 800;
    b.onclick = () => { playClick(); onClick(); };
    return b;
  }

  // UI toggle (non-modal): if open, close; if closed and near a game open
  function toggleUiFocus() {
    if (uiRoot.style.display === "flex") closeUi();
    else {
      const g = findNearbyGame();
      if (g) openUiForGame(g);
    }
  }

  // When pressing E, act on nearest game (open UI)
  function handleInteract() {
    const g = findNearbyGame();
    if (g) openUiForGame(g);
  }

  /* -------------------- Lightweight Game Logic -------------- */
  // Economy (simple)
  const Economy = { balance: 1000, canBet(b) { return this.balance >= b; }, bet(b) { this.balance -= b; }, pay(x) { this.balance += x; } };

  // --- Roulette ---
  async function startRouletteSpin(group) {
    const ud = group.userData;
    if (ud.spin) return;
    const bet = ud.bet;
    if (!Economy.canBet(bet)) { alert("Not enough balance."); return; }
    Economy.bet(bet);
    ud.spin = true;
    ud.pending = Math.floor(Math.random() * 37);
    ud.settle = 1.6 + Math.random() * 1.2;
    // animate wheel quickly but simply
    const wheel = ud.wheel;
    const ball = ud.ball;
    let t = 0;
    while (ud.settle > 0) {
      const dt = await tickFrame();
      ud.settle -= dt;
      t += dt;
      wheel.rotation.y += dt * 8.0;
      ball.position.x = Math.cos(t * 12.0) * 0.48;
      ball.position.z = Math.sin(t * 12.0) * 0.48;
    }
    // landing
    const n = ud.pending;
    ud.last = n;
    ud.spin = false;
    // determine win (simple parity example)
    const isWin = (ud.bet % 2 === 0 && n % 2 === 0) || (ud.bet % 2 === 1 && n % 2 === 1);
    if (isWin) {
      const payout = Math.floor(bet * 1.5);
      Economy.pay(bet + payout);
      alert(`WIN! Number ${n} • Profit $${payout}`);
    } else {
      alert(`Lose. Number ${n}`);
    }
    closeUi();
  }

  // --- Slots ---
  function spinSlots(group) {
    const ud = group.userData;
    if (ud.spinning) return;
    const bet = ud.bet;
    if (!Economy.canBet(bet)) { alert("Not enough balance."); return; }
    Economy.bet(bet);
    ud.spinning = true;

    // lightweight "spin" animation using canvas
    const symbols = ["🍒", "🔔", "7", "🍋", "🍇"];
    const picks = [randChoice(symbols), randChoice(symbols), randChoice(symbols)];
    // visual update on the group's screen draw if exists
    if (ud.screenDraw) ud.screenDraw(picks[0], picks[1], picks[2], "SPINNING...");
    // short timeout to simulate spinning
    setTimeout(() => {
      ud.last = picks;
      // simple 3-of-kind win rule
      if (picks[0] === picks[1] && picks[1] === picks[2]) {
        const profit = bet * 8;
        Economy.pay(bet + profit);
        alert(`SLOTS: 3x ${picks[0]}! Profit $${profit}`);
      } else {
        alert("SLOTS: No win");
      }
      if (ud.screenDraw) ud.screenDraw(picks[0], picks[1], picks[2], "RESULT");
      ud.spinning = false;
      closeUi();
    }, 700);
  }

  // --- Blackjack (very small local rules) ---
  function makeDeck() {
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits = ["♠", "♥", "♦", "♣"];
    const deck = [];
    for (const s of suits) for (const r of ranks) deck.push({ r, s, v: r === "A" ? 11 : (["J", "Q", "K"].includes(r) ? 10 : Number(r)) });
    for (let i = deck.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  }

  function dealBlackjack(group) {
    const ud = group.userData;
    if (ud.phase !== "ready") { alert("Round in progress."); return; }
    if (!Economy.canBet(ud.bet)) { alert("Not enough balance."); return; }
    Economy.bet(ud.bet);
    ud.deck = makeDeck();
    ud.playerHand = [ud.deck.pop(), ud.deck.pop()];
    ud.dealerHand = [ud.deck.pop(), ud.deck.pop()];
    ud.phase = "player";
    alert(`DEAL: You ${handLabels(ud.playerHand)} Dealer shows ${cardLabel(ud.dealerHand[0])}`);
    // UI remains open for HIT/STAND
  }

  function bjHit(group) {
    const ud = group.userData;
    if (ud.phase !== "player") return;
    ud.playerHand.push(ud.deck.pop());
    const s = handScore(ud.playerHand);
    if (s > 21) {
      ud.phase = "ready";
      alert(`BUST! You ${handLabels(ud.playerHand)} (score ${s})`);
      closeUi();
    } else {
      alert(`Hit: ${handLabels(ud.playerHand)} (score ${s})`);
    }
  }

  function bjStand(group) {
    const ud = group.userData;
    if (ud.phase !== "player") return;
    ud.phase = "dealer";
    // dealer plays simple rule: hit <17
    while (handScore(ud.dealerHand) < 17) ud.dealerHand.push(ud.deck.pop());
    const ps = handScore(ud.playerHand), ds = handScore(ud.dealerHand);
    if (ds > 21 || ps > ds) {
      const profit = ud.bet;
      Economy.pay(ud.bet + profit);
      alert(`You win! Player ${ps} Dealer ${ds} • +$${profit}`);
    } else if (ps === ds) {
      Economy.pay(ud.bet);
      alert(`Push. Player ${ps} Dealer ${ds}`);
    } else {
      alert(`Dealer wins. Player ${ps} Dealer ${ds}`);
    }
    ud.phase = "ready";
    closeUi();
  }

  function handScore(hand) {
    let t = hand.reduce((s, c) => s + c.v, 0);
    let aces = hand.filter(c => c.r === "A").length;
    while (t > 21 && aces > 0) { t -= 10; aces--; }
    return t;
  }
  function handLabels(hand) { return hand.map(c => c.r + c.s).join(" "); }
  function cardLabel(c) { return c.r + c.s; }

  /* ------------------ Utility small helpers ----------------- */
  function randChoice(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function tickFrame() {
    return new Promise(res => requestAnimationFrame(() => res(SIM_DT)));
  }

  /* --------------------- Hover Prompt ----------------------- */
  const prompt = document.createElement("div");
  prompt.style.position = "fixed";
  prompt.style.left = "50%";
  prompt.style.bottom = "18px";
  prompt.style.transform = "translateX(-50%)";
  prompt.style.padding = "10px 14px";
  prompt.style.borderRadius = "999px";
  prompt.style.background = "rgba(0,0,0,0.36)";
  prompt.style.color = "#fff";
  prompt.style.fontWeight = "800";
  prompt.style.display = "none";
  prompt.textContent = "Press E to interact";
  document.body.appendChild(prompt);

  function updateHover() {
    const g = findNearbyGame();
    if (g) {
      prompt.style.display = "block";
      return;
    }
    prompt.style.display = "none";
  }

  /* --------------------- Animation Loop --------------------- */
  const clock = new THREE.Clock();
  let acc = 0;

  function simStep(dt) {
    updateMovement(dt);
    // lightweight per-game animations (wheel spin visual only)
    for (const g of Games.list) {
      if (g.userData && g.userData.type === "roulette" && g.userData.spin) {
        // rotate wheel faster while spinning
        g.userData.wheel.rotation.y += dt * 8.0;
      }
    }
    updateHover();
  }

  function animate() {
    requestAnimationFrame(animate);
    const frame = Math.min(0.05, clock.getDelta());
    acc += frame;
    let steps = 0;
    while (acc >= SIM_DT && steps < 6) {
      simStep(SIM_DT);
      acc -= SIM_DT;
      steps++;
    }
    renderer.render(scene, camera);
  }
  animate();

  /* ----------------------- Resize --------------------------- */
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(RENDER_PIXEL_RATIO_CAP);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* --------------------- Boot UX ---------------------------- */
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.addEventListener("click", () => {
      if (!started) {
        started = true;
        overlay.style.display = "none";
      }
      canvas.requestPointerLock?.();
    });
  }

  /* --------------------- Expose debug ----------------------- */
  window.CasinoFocus = {
    scene, camera, renderer, Games, Economy, openUiForGame, closeUi
  };

  // small helpful console message
  console.info("CasinoFocus loaded — games-first mode. Use E near a table or Tab to focus UI.");

})();