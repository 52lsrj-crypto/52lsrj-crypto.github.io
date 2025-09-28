// 枫树四季页面主脚本
// 功能：根据季节切换真实照片背景与主题色，并在 Canvas 上绘制飘落叶子

const hero = document.getElementById("hero");
const canvas = document.getElementById("leafCanvas");
const ctx = canvas.getContext("2d");
const seasonSelect = document.getElementById("seasonSelect");
const toggleLeaves = document.getElementById("toggleLeaves");
const seasonBadge = document.getElementById("seasonBadge");
const seasonTitle = document.getElementById("seasonTitle");
const seasonDesc = document.getElementById("seasonDesc");

// 设备像素比，保证高清显示
const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

// 季节配置：替换为你的真实图片路径
const SEASON_CONFIG = {
  spring: {
    label: "春",
    title: "春和景明",
    desc: "万物新生，枝头吐芽，嫩叶清新浅绿，微风轻拂。",
    accent: "#2ecc71",
    treeImage: "assets/maple/tree-spring.jpg",
    leafImages: [
      "assets/maple/leaves/leaf-spring-1.png",
      "assets/maple/leaves/leaf-spring-2.png",
    ],
    leafCount: 60,
    gravity: 18,
    wind: { base: 12, gust: 140 },
  },
  summer: {
    label: "夏",
    title: "绿荫如海",
    desc: "盛夏浓荫，叶片厚实墨绿，微风中偶有轻飘。",
    accent: "#16a085",
    treeImage: "assets/maple/tree-summer.jpg",
    leafImages: [
      "assets/maple/leaves/leaf-summer-1.png",
      "assets/maple/leaves/leaf-summer-2.png",
    ],
    leafCount: 36,
    gravity: 24,
    wind: { base: 16, gust: 160 },
  },
  autumn: {
    label: "秋",
    title: "霜林尽染",
    desc: "枫叶似火，层林尽染，风起时叶片翻飞，漫天如雨。",
    accent: "#d35400",
    treeImage: "assets/maple/tree-autumn.jpg",
    leafImages: [
      "assets/maple/leaves/leaf-autumn-1.png",
      "assets/maple/leaves/leaf-autumn-2.png",
      "assets/maple/leaves/leaf-autumn-3.png",
    ],
    leafCount: 120,
    gravity: 30,
    wind: { base: 22, gust: 220 },
  },
  winter: {
    label: "冬",
    title: "万籁寂寥",
    desc: "寒冬枯枝，天地素简，偶有残叶随风而下。",
    accent: "#5dade2",
    treeImage: "assets/maple/tree-winter.jpg",
    leafImages: [
      // 冬季一般无叶，可留空；如需残叶效果可放置深褐色叶片 PNG
      // "assets/maple/leaves/leaf-winter-1.png"
    ],
    leafCount: 0, // 设为 0 表示不生成叶子；如需残叶，可设置为 10~20
    gravity: 28,
    wind: { base: 12, gust: 180 },
  },
};

// 移动端适度降载
const isMobile =
  typeof matchMedia === "function" &&
  matchMedia("(max-width: 768px)").matches;

function getAutoSeasonByMonth(date = new Date()) {
  const m = date.getMonth(); // 0..11
  if (m === 11 || m <= 1) return "winter"; // 12,1,2
  if (m >= 2 && m <= 4) return "spring"; // 3,4,5
  if (m >= 5 && m <= 7) return "summer"; // 6,7,8
  return "autumn"; // 9,10,11
}

// 预加载图片，返回 Promise
function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    unique.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ url, ok: true, img });
          img.onerror = () => resolve({ url, ok: false });
          img.src = url;
        })
    )
  );
}

// Canvas 及叶子系统
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

// 简易噪声（基于正弦叠加），用于风的缓慢变化
function breezeNoise(t, seed = 0) {
  return (
    Math.sin(t * 0.0007 + seed) * 0.6 +
    Math.sin(t * 0.0013 + seed * 2.1) * 0.3 +
    Math.sin(t * 0.0023 + seed * 3.7) * 0.1
  );
}

class Leaf {
  constructor(img, bounds, season) {
    this.img = img;
    this.season = season;
    this.reset(true, bounds);
  }
  reset(fromTop = false, bounds = { W, H }) {
    const { W, H } = bounds;
    const baseScale = isMobile ? 0.5 : 1;
    // 随机生成初始位置与参数
    this.scale = baseScale * (0.4 + Math.random() * 0.9);
    this.width = this.img.naturalWidth * this.scale;
    this.height = this.img.naturalHeight * this.scale;
    this.x = Math.random() * W;
    this.y = fromTop ? -this.height - Math.random() * H * 0.6 : Math.random() * H;
    this.vx = (Math.random() - 0.5) * 20; // 水平初速
    this.vy = 10 + Math.random() * 20; // 下落初速
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.02; // 旋转速度
    this.swing = (0.6 + Math.random() * 1.2) * this.scale; // 左右摆动幅度
    this.flip = Math.random() < 0.5 ? -1 : 1; // 简单翻面
    this.opacity = 0.8 + Math.random() * 0.2;
  }
  step(dt, t, windX, gravity) {
    // 摆动 + 风
    const sway = Math.sin(t * 0.003 + this.x * 0.02) * this.swing;
    this.vx += (windX + sway * 0.2) * (dt / 1000);
    this.vy += gravity * (dt / 1000);

    this.x += this.vx * (dt / 16);
    this.y += this.vy * (dt / 16);

    this.angle += this.spin * (dt / 16);

    // 出界再生
    if (this.y > H + this.height || this.x < -this.width * 2 || this.x > W + this.width * 2) {
      this.reset(true);
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.flip * this.scale, this.scale);
    ctx.drawImage(this.img, -this.img.naturalWidth / 2, -this.img.naturalHeight / 2);
    ctx.restore();
  }
}

let leaves = [];
let running = true;
let currentSeasonKey = "autumn";
let assets = {
  treeOk: false,
  leafImgs: [],
};
let windGust = 0; // 瞬时阵风分量，逐步衰减
let lastTime = performance.now();

function setThemeAccent(color) {
  document.documentElement.style.setProperty("--accent", color);
}

function applySeasonVisual(seasonKey) {
  const cfg = SEASON_CONFIG[seasonKey];
  // 背景图
  if (cfg.treeImage) {
    hero.style.backgroundImage = `url("${cfg.treeImage}")`;
  }
  // 主题色
  setThemeAccent(cfg.accent);
  // 文案
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
    if (!img) continue;
    leaves.push(new Leaf(img, { W, H }, seasonKey));
  }
}

function updateSeason(targetKey) {
  currentSeasonKey = targetKey;
  applySeasonVisual(targetKey);
  rebuildLeaves(targetKey);
}

function computeSeasonFromSelect() {
  const v = seasonSelect.value;
  if (v === "auto") {
    return getAutoSeasonByMonth();
  }
  return v;
}

function onResize() {
  resizeCanvas();
}

function onPointer() {
  // 触发阵风
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
  // windX 单位像素/秒，dt 基于 16ms 标准化
  let windX = (base + noise * base) * 0.6;

  if (windGust > 0) {
    windX += windGust;
    windGust *= 0.95; // 衰减
    if (windGust < 1) windGust = 0;
  }

  if (running && toggleLeaves.checked) {
    for (const leaf of leaves) {
      leaf.step(dt, t, windX, cfg.gravity);
      leaf.draw(ctx);
    }
  }

  requestAnimationFrame(tick);
}

async function init() {
  resizeCanvas();
  window.addEventListener("resize", onResize, { passive: true });
  hero.addEventListener("click", onPointer);
  hero.addEventListener("touchstart", onPointer, { passive: true });

  // 预加载：当前季节（默认 autumn）所有相关图片
  const seasonKey = computeSeasonFromSelect();
  currentSeasonKey = seasonKey;

  const cfg = SEASON_CONFIG[seasonKey];
  const allUrls = [
    cfg.treeImage,
    ...cfg.leafImages,
    // 额外预取其它季节背景，减少切换等待（可选）
    SEASON_CONFIG.spring.treeImage,
    SEASON_CONFIG.summer.treeImage,
    SEASON_CONFIG.autumn.treeImage,
    SEASON_CONFIG.winter.treeImage,
  ].filter(Boolean);

  const results = await preloadImages(allUrls);

  // 记录叶子图片
  const leafImgs = [];
  for (const url of cfg.leafImages) {
    const hit = results.find((r) => r.url === url && r.ok);
    if (hit && hit.img) leafImgs.push(hit.img);
  }
  assets.leafImgs = leafImgs;

  // 应用季节外观
  applySeasonVisual(seasonKey);
  rebuildLeaves(seasonKey);

  // 交互
  seasonSelect.addEventListener("change", () => {
    const key = computeSeasonFromSelect();
    updateSeason(key);
  });
  toggleLeaves.addEventListener("change", () => {
    // 开关仅影响渲染，不需要重建
  });

  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(tick);
  });
}

document.addEventListener("DOMContentLoaded", init);