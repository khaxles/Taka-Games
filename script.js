const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let animationFrameId;
let effectsIntervalId;
let statsIntervalId;

let stars = [];
let shootingStars = [];
let twinkles = [];

const numStars = 200;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function init() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);

  stars = [];
  for (let i = 0; i < numStars; i++) {
    const originX =
      Math.random() * window.innerWidth * 2 - window.innerWidth * 0.5;
    const originY =
      Math.random() * window.innerHeight * 2 - window.innerHeight * 0.5;
    const angle = Math.random() * Math.PI * 2;
    stars.push({
      x: originX,
      y: originY,
      originX,
      originY,
      angle,
      radius: Math.random() * 0.5 + 0.5,
      size: Math.random() * 1.5 + 0.5,
      baseSpeedX: Math.random() * 0.05 - 0.025,
      baseSpeedY: Math.random() * 0.05 - 0.025,
    });
  }
}

function createShootingStar() {
  const angle = 25 * (Math.PI / 180);
  const startX = -100;
  const startY = Math.random() * window.innerHeight * 0.5;
  shootingStars.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * 10,
    vy: Math.sin(angle) * 10,
    length: Math.random() * 100 + 50,
    opacity: 1,
  });
}

function createTwinkle() {
  twinkles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2 + 1,
    life: 1.0,
  });
}

function animate() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  stars.forEach((s) => {
    const dx = (mouseX - window.innerWidth / 2) * 0.001;
    const dy = (mouseY - window.innerHeight / 2) * 0.001;
    const toOriginX = (s.originX - s.x) * 0.0025;
    const toOriginY = (s.originY - s.y) * 0.0025;

    s.angle += 0.001;
    const circularX = Math.cos(s.angle) * s.radius;
    const circularY = Math.sin(s.angle) * s.radius;

    s.x += s.baseSpeedX + dx + toOriginX + circularX;
    s.y += s.baseSpeedY + dy + toOriginY + circularY;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });

  twinkles.forEach((t, i) => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${t.life})`;
    ctx.shadowColor = `rgba(255, 255, 255, ${t.life})`;
    ctx.shadowBlur = 10;
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    t.life -= 0.02;
    if (t.life <= 0) twinkles.splice(i, 1);
  });

  shootingStars.forEach((s, i) => {
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(
      s.x - Math.cos((25 * Math.PI) / 180) * s.length,
      s.y - Math.sin((25 * Math.PI) / 180) * s.length
    );
    ctx.stroke();

    s.x += s.vx;
    s.y += s.vy;
    s.opacity -= 0.005;

    if (
      s.opacity <= 0 ||
      s.x > window.innerWidth + 100 ||
      s.y > window.innerHeight + 100
    ) {
      shootingStars.splice(i, 1);
    }
  });

  animationFrameId = requestAnimationFrame(animate);
}

window.addEventListener("resize", init);

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("contextmenu", (event) => event.preventDefault());

const games = {
  "game-card-sab": { universeId: 8416185837 },
  "game-card-sap": { universeId: 8122648570 },
  "game-card-ps99": { universeId: 8167079083 },
  "game-card-dr": { universeId: 8373331401 },
};

function animateCount(element, end, duration) {
  const start = parseInt(element.textContent.replace(/,/g, "")) || 0;
  const range = end - start;
  let startTime = null;

  function step(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const currentValue = Math.floor(progress * range + start);
    element.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

async function fetchGameStats() {
  const universeIds = Object.values(games)
    .map((game) => game.universeId)
    .join(",");

  const apiUrl = `https://games.roproxy.com/v1/games?universeIds=${universeIds}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`status: ${response.status}`);
    }

    const { data } = await response.json();

    data.forEach((gameData) => {
      const gameSelector = Object.keys(games).find(
        (key) => games[key].universeId === gameData.id
      );

      if (gameSelector) {
        const card = document.querySelector(`.${gameSelector}`);
        if (card) {
          const playerCount = card.querySelector(
            ".stat-item:nth-child(1) span"
          );
          const visits = card.querySelector(".stat-item:nth-child(2) span");
          const favorites = card.querySelector(".stat-item:nth-child(3) span");

          animateCount(playerCount, gameData.playing, 1500);
          animateCount(visits, gameData.visits, 1500);
          animateCount(favorites, gameData.favoritedCount, 1500);
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch game stats:", error);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animationFrameId);
    clearInterval(effectsIntervalId);
    clearInterval(statsIntervalId);
  } else {
    animate();
    effectsIntervalId = setInterval(() => {
      if (shootingStars.length < 3) createShootingStar();
      if (twinkles.length < 20) createTwinkle();
    }, 1000);
    fetchGameStats();
    statsIntervalId = setInterval(fetchGameStats, 10000);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
  fetchGameStats();

  effectsIntervalId = setInterval(() => {
    if (shootingStars.length < 3) createShootingStar();
    if (twinkles.length < 20) createTwinkle();
  }, 1000);

  statsIntervalId = setInterval(fetchGameStats, 10000);
});



