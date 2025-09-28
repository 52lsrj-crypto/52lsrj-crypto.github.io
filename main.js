// 枫树四季页面主脚本（临时外链图片演示 + 冬季下雪 + 叶子图片缺失时的图形兜底）

const hero = document.getElementById("hero");
const canvas = document.getElementById("leafCanvas");
const ctx = canvas.getContext("2d");
const seasonSelect = document.getElementById("seasonSelect");
const toggleLeaves = document.getElementById("toggleLeaves");
const seasonBadge = document.getElementById("seasonBadge");
const seasonTitle = document.getElementById("seasonTitle");
const seasonDesc = document.getElementById("seasonDesc");

// 高清显示
const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

// 外链占位背景（演示用；后续建议换回 assets 下的真实照片）
const SEASON_CONFIG = {
  spring: {
    label: "春",
    title: "春和景明",
    desc: "万物新生，枝头吐芽，嫩叶清新浅绿，微风轻拂。",
    accent: "#2ecc71",
    treeImage: "https://picsum.photos/seed/maple-spring/1920/1080",
    leafImages: [], // 临时不使用外链叶片，转为图形兜底
    leafCount: 60,
    gravity: 18,
    wind: { base: 12, gust: 140 },
    leafColor: "#7cd67f",
  },
  summer: {
    label: "夏",
    title: "绿荫如海",
    desc: "盛夏浓荫，叶片厚实墨绿，微风中偶有轻飘。",
    accent: "#16a085",
    treeImage: "https://picsum.photos/seed/maple-summer/1920/1080",
    leafImages: [],
    leafCount: 36,
    gravity: 24,
    wind: { base: 16, gust: 160 },
    leafColor: "#1f8f62",
  },
  autumn: {
    label: "秋",
    title: "霜林尽染",
    desc: "枫叶似火，层林尽染，风起时叶片翻飞，漫天如雨。",
    accent: "#d35400",
    treeImage:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
    leafImages: [],
    leafCount: 120,
    gravity: 30,
    wind: { base: 22, gust: 220 },
    leafColor: "#d65a1f",
  },
  winter: {
    label: "冬",
    title: "万籁寂寥",
    desc: "寒冬枯枝，天地素简，默认仅下雪不飘叶。",
    accent: "#5dade2",
    treeImage: "https://picsum.photos/seed/maple-winter-snow/1920/1080",
    leafImages: [],
    leafCount: 0, // 冬季默认不生成叶子
    gravity: 28,
    wind: { base: 12, gust: 180 },
    leafColor: "#8b6b4c",
  },
};

// 移动端降载
const isMobile =
  typeof matchMedia === "function" &&
  matchMedia("(max-width: 768px)").matches;

// 根据月份推断季节
function getAutoSeasonByMonth(date = new Date()) {
  const m = date.getMonth(); // 0..11
  if (m === 11 || m <= 1) return "winter"; // 12,1,2
  if (m >= 2 && m <= 4) return "spring"; // 3,4,5
  if (m >= 5 && m <= 7) return "summer"; // 6,7,8
  return "autumn"; // 9,10,11
}

// 预加载图片
function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    unique.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ url, ok: true, img });
          img.onerror = () => resolve({ url, ok: false });
          img.src = url;
        })
    )
  );
}

// 画布尺寸
let W = 0;
let H = 0;

function resizeCanvas() {
  const rect = hero.getBoundingClientRect();
  W = Math.max(320, Math.floor(rect.width));
  H = Math.max(320, Math.floor(rect.height));
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// 风噪声
function breezeNoise(t, seed = 0) {
  return (
    Math.sin(t * 0.0007 + seed) * 0.6 +
    Math.sin(t * 0.0013 + seed * 2.1) * 0.3 +
    Math.sin(t * 0.0023 + seed * 3.7) * 0.1
  );
}

// 叶子
class Leaf {
  constructor(img, bounds, seasonKey, color) {
    this.img = img || null;
    this.color = color;
    this.reset(true, bounds);
  }
  reset(fromTop = false, bounds = { W, H }) {
    const { W, H } = bounds;
    const baseScale = isMobile ? 0.5 : 1;
    this.scale = baseScale * (0.4 + Math.random() * 0.9);
    this.width = (this.img?.naturalWidth || 128) * this.scale;
    this.height = (this.img?.naturalHeight || 128) * this.scale;
    this.x = Math.random() * W;
    this.y = fromTop ? -this.height - Math.random() * H * 0.6 : Math.random() * H;
    this.vx = (Math.random() - 0.5) * 20;
    this.vy = 10 + Math.random() * 20;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.02;
    this.swing = (0.6 + Math.random() * 1.2) * this.scale;
    this.flip = Math.random() < 0.5 ? -1 : 1;
    this.opacity = 0.8 + Math.random() * 0.2;
  }
  step(dt, t, windX, gravity) {
    const sway = Math.sin(t * 0.003 + this.x * 0.02) * this.swing;
    this.vx += (windX + sway * 0.2) * (dt / 1000);
    this.vy += gravity * (dt / 1000);

    this.x += this.vx * (dt / 16);
    this.y += this.vy * (dt / 16);

    this.angle += this.spin * (dt / 16);

    if (
      this.y > H + this.height ||
      this.x < -this.width * 2 ||
      this.x > W + this.width * 2
    ) {
      this.reset(true);
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.flip * this.scale, this.scale);

    if (this.img) {
      ctx.drawImage(
        this.img,
        -this.img.naturalWidth / 2,
        -this.img.naturalHeight / 2
      );
    } else {
      // 图形兜底：简化的“叶片”形状（用于临时演示）
      const size = 48;
      ctx.fillStyle = this.color || "#d65a1f";
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.9);
      ctx.quadraticCurveTo(size * 0.8, -size * 0.6, size * 0.6, 0);
      ctx.quadraticCurveTo(size * 0.8, size * 0.6, 0, size * 0.9);
      ctx.quadraticCurveTo(-size * 0.8, size * 0.6, -size * 0.6, 0);
      ctx.quadraticCurveTo(-size * 0.8, -size * 0.6, 0, -size * 0.9);
      ctx.closePath();
      ctx.fill();

      // 叶脉
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.85);
      ctx.lineTo(0, size * 0.85);
      ctx.moveTo(0, -size * 0.2);
      ctx.lineTo(size * 0.5, -size * 0.5);
      ctx.moveTo(0, -size * 0.2);
      ctx.lineTo(-size * 0.5, -size * 0.5);
      ctx.moveTo(0, size * 0.25);
      ctx.lineTo(size * 0.5, size * 0.4);
      ctx.moveTo(0, size * 0.25);
      ctx.lineTo(-size * 0.5, size * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// 雪花（冬季）
class Snowflake {
  constructor(bounds) {
    this.reset(true, bounds);
  }
  reset(fromTop = false, bounds = { W, H }) {
    const { W, H } = bounds;
    this.r = 1 + Math.random() * 2.5;
    this.x = Math.random() * W;
    this.y = fromTop ? -10 - Math.random() * H * 0.4 : Math.random() * H;
    this.vx = (-0.3 + Math.random() * 0.6) * (isMobile ? 0.7 : 1);
    this.vy = (0.6 + Math.random() * 1.4) * (isMobile ? 0.8 : 1.2);
    this.swing = Math.random() * 1.2;
    this.phase = Math.random() * Math.PI * 2;
    this.opacity = 0.7 + Math.random() * 0.3;
  }
  step(dt, t, windX) {
    const sway = Math.sin(t * 0.003 + this.phase) * this.swing;
    this.x += (this.vx + windX * 0.01 + sway) * (dt / 16);
    this.y += this.vy * (dt / 16);
    if (this.y > H + 10 || this.x < -10 || this.x > W + 10) {
      this.reset(true);
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let leaves = [];
let snowflakes = [];
let running = true;
let currentSeasonKey = "autumn";
let assets = { leafImgs: [] };
let windGust = 0;
let lastTime = performance.now();

function setThemeAccent(color) {
  document.documentElement.style.setProperty("--accent", color);
}

function applySeasonVisual(seasonKey) {
  const cfg = SEASON_CONFIG[seasonKey];
  if (cfg.treeImage) {
    hero.style.backgroundImage = `url("${cfg.treeImage}")`;
  }
  setThemeAccent(cfg.accent);
  seasonBadge.textContent = cfg.label;
  seasonTitle.textContent = cfg.title;
  seasonDesc.textContent = cfg.desc;
}

function rebuildLeaves(seasonKey) {
  const cfg = SEASON_CONFIG[seasonKey];
  leaves = [];
  const baseCount = cfg.leafCount;
  const count = isMobile ? Math.max(0, Math.round(baseCount * 0.6)) : baseCount;

  for (let i = 0; i < count; i++) {
    const img = assets.leafImgs[i % Math.max(1, assets.leafImgs.length)];
    leaves.push(new Leaf(img, { W, H }, seasonKey, cfg.leafColor));
  }
}

function rebuildSnow(seasonKey) {
  snowflakes = [];
  if (seasonKey !== "winter") return;
  const target = isMobile ? 180 : 320;
  for (let i = 0; i < target; i++) {
    snowflakes.push(new Snowflake({ W, H }));
  }
}

function updateSeason(targetKey) {
  currentSeasonKey = targetKey;
  applySeasonVisual(targetKey);
  rebuildLeaves(targetKey);
  rebuildSnow(targetKey);
}

function computeSeasonFromSelect() {
  const v = seasonSelect.value;
  if (v === "auto") return getAutoSeasonByMonth();
  return v;
}

function onResize() {
  resizeCanvas();
}

function onPointer() {
  const cfg = SEASON_CONFIG[currentSeasonKey];
  windGust = Math.max(windGust, cfg.wind.gust);
}

function tick(now) {
  const dt = Math.min(48, now - lastTime);
  lastTime = now;

  ctx.clearRect(0, 0, W, H);

  const cfg = SEASON_CONFIG[currentSeasonKey];
  const t = now;
  const base = cfg.wind.base;
  const noise = breezeNoise(t, 12.34);
  let windX = (base + noise * base) * 0.6;

  if (windGust > 0) {
    windX += windGust;
    windGust *= 0.95;
    if (windGust < 1) windGust = 0;
  }

  if (running) {
    if (toggleLeaves.checked) {
      for (const leaf of leaves) {
        leaf.step(dt, t, windX, cfg.gravity);
        leaf.draw(ctx);
      }
    }
    if (currentSeasonKey === "winter") {
      for (const flake of snowflakes) {
        flake.step(dt, t, windX);
        flake.draw(ctx);
      }
    }
  }

  requestAnimationFrame(tick);
}

async function init() {
  resizeCanvas();
  window.addEventListener("resize", onResize, { passive: true });
  hero.addEventListener("click", onPointer);
  hero.addEventListener("touchstart", onPointer, { passive: true });

  const seasonKey = computeSeasonFromSelect();
  currentSeasonKey = seasonKey;

  const cfg = SEASON_CONFIG[seasonKey];
  const allUrls = [
    cfg.treeImage,
    // 预取其它季节背景，减少切换等待（演示）
    SEASON_CONFIG.spring.treeImage,
    SEASON_CONFIG.summer.treeImage,
    SEASON_CONFIG.autumn.treeImage,
    SEASON_CONFIG.winter.treeImage,
    // 如果以后配置了 leafImages，这里也会自动预加载
    ...cfg.leafImages,
  ].filter(Boolean);

  const results = await preloadImages(allUrls);

  // 收集当前季节叶片图片（当前为演示，不提供外链叶片，走图形兜底）
  const leafImgs = [];
  for (const url of cfg.leafImages) {
    const hit = results.find((r) => r.url === url && r.ok);
    if (hit && hit.img) leafImgs.push(hit.img);
  }
  assets.leafImgs = leafImgs;

  applySeasonVisual(seasonKey);
  rebuildLeaves(seasonKey);
  rebuildSnow(seasonKey);

  seasonSelect.addEventListener("change", () => {
    const key = computeSeasonFromSelect();
    updateSeason(key);
  });

  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(tick);
  });
}

document.addEventListener("DOMContentLoaded", init);