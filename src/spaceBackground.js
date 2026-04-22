const STAR_COLORS = ["#f8fbff", "#2ff8ff", "#ff3df2", "#9b5cff", "#4aa8ff"];
const SUNSET_SKY_COLORS = Object.freeze({
  top: "#ffe08a",
  mid: "#ff9248",
  low: "#ff5630",
  horizon: "#ffca57",
  sun: "#ffd166",
  ground: "#3c8c49",
  road: "#1f2a32",
  roadStripe: "#ffd166",
  palm: "#245f33",
  palmAccent: "#3ea04d",
  car: "#d72638",
  carDark: "#8f1a26"
});

/**
 * Animated retro pixel space background rendered on canvas.
 */
export class RetroSpaceBackground {
  /**
   * @param {HTMLCanvasElement} canvas Drawing surface.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.pointer = { x: 0, y: 0, active: false };
    this.stars = [];
    this.objects = [];
    this.particles = [];
    this.explosions = [];
    this.warpUntil = 0;
    this.frameId = 0;
    this.theme = "dark";

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.draw = this.draw.bind(this);
  }

  /**
   * Starts animation and interaction listeners.
   *
   * @returns {void}
   */
  start() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("click", this.handleClick);
    this.frameId = requestAnimationFrame(this.draw);
  }

  /**
   * Triggers the hyperspace effect used for big wins.
   *
   * @returns {void}
   */
  triggerWarp() {
    this.warpUntil = performance.now() + 1400;
  }

  /**
   * Launches several pixel firework bursts in the background.
   *
   * @returns {void}
   */
  triggerFireworks() {
    if (this.theme === "light") {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let index = 0; index < 7; index += 1) {
      this.explosions.push({
        x: width * (0.16 + Math.random() * 0.68),
        y: height * (0.12 + Math.random() * 0.42),
        age: -index * 4,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        firework: true
      });
    }
  }

  /**
   * @param {"dark" | "light"} theme Background theme.
   * @returns {void}
   */
  setTheme(theme) {
    this.theme = theme === "light" ? "light" : "dark";
  }

  /**
   * Tears down listeners and animation.
   *
   * @returns {void}
   */
  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("click", this.handleClick);
  }

  /**
   * @returns {void}
   */
  handleResize() {
    const { innerWidth: width, innerHeight: height } = window;
    this.canvas.width = Math.floor(width * this.pixelRatio);
    this.canvas.height = Math.floor(height * this.pixelRatio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    const mobile = width < 680;
    const starCount = mobile ? 130 : 260;
    const particleCount = mobile ? 20 : 46;

    this.stars = Array.from({ length: starCount }, () => this.createStar(width, height));
    this.objects = this.createSpaceObjects(width, height);
    this.particles = Array.from({ length: particleCount }, () => this.createParticle(width, height));
  }

  /**
   * @param {PointerEvent} event Pointer move event.
   * @returns {void}
   */
  handlePointerMove(event) {
    this.pointer = { x: event.clientX, y: event.clientY, active: true };
  }

  /**
   * @returns {void}
   */
  handlePointerLeave() {
    this.pointer.active = false;
  }

  /**
   * @param {MouseEvent} event Click event.
   * @returns {void}
   */
  handleClick(event) {
    if (this.theme === "light") {
      return;
    }

    this.explosions.push({
      x: event.clientX,
      y: event.clientY,
      age: 0,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    });
  }

  /**
   * @param {DOMHighResTimeStamp} time Animation timestamp.
   * @returns {void}
   */
  draw(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ctx = this.context;
    const parallaxX = this.pointer.active ? (this.pointer.x / width - 0.5) : 0;
    const parallaxY = this.pointer.active ? (this.pointer.y / height - 0.5) : 0;

    ctx.clearRect(0, 0, width, height);

    if (this.theme === "light") {
      this.drawSunsetScene(ctx, width, height, time, parallaxX, parallaxY);
    } else {
      this.drawGrid(ctx, width, height, parallaxX);
      this.drawStars(ctx, width, height, time, parallaxX, parallaxY);
      this.drawObjects(ctx, width, height, time, parallaxX, parallaxY);
      this.drawParticles(ctx, width, height, time);
      this.drawExplosions(ctx);

      if (time < this.warpUntil) {
        this.drawWarp(ctx, width, height, time);
      }
    }

    this.frameId = requestAnimationFrame(this.draw);
  }

  /**
   * @param {number} width View width.
   * @param {number} height View height.
   * @returns {{ x: number, y: number, size: number, speed: number, color: string, phase: number }}
   */
  createStar(width, height) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() > 0.82 ? 3 : 2,
      speed: 0.04 + Math.random() * 0.18,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      phase: Math.random() * Math.PI * 2
    };
  }

  /**
   * @param {number} width View width.
   * @param {number} height View height.
   * @returns {Array<{ x: number, y: number, radius: number, color: string, ring: boolean, speed: number }>}
   */
  createSpaceObjects(width, height) {
    return [
      { x: width * 0.16, y: height * 0.2, radius: 30, color: "#9b5cff", ring: true, speed: 0.04 },
      { x: width * 0.82, y: height * 0.72, radius: 44, color: "#2ff8ff", ring: false, speed: -0.03 },
      { x: width * 0.74, y: height * 0.18, radius: 12, color: "#ff3df2", ring: true, speed: 0.06 }
    ];
  }

  /**
   * @param {number} width View width.
   * @param {number} height View height.
   * @returns {{ x: number, y: number, speed: number, size: number, color: string }}
   */
  createParticle(width, height) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.18 + Math.random() * 0.32,
      size: 2 + Math.random() * 3,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    };
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} parallaxX Pointer offset.
   * @returns {void}
   */
  drawGrid(ctx, width, height, parallaxX) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#2ff8ff";
    ctx.lineWidth = 1;

    for (let x = -40; x < width + 40; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x + parallaxX * 20, height);
      ctx.lineTo(width / 2 + (x - width / 2) * 0.26, height * 0.58);
      ctx.stroke();
    }

    for (let y = height * 0.6; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @param {number} parallaxX Pointer x offset.
   * @param {number} parallaxY Pointer y offset.
   * @returns {void}
   */
  drawStars(ctx, width, height, time, parallaxX, parallaxY) {
    this.stars.forEach((star) => {
      star.y += star.speed;
      star.x += star.speed * 0.18;

      if (star.y > height + 8) {
        star.y = -8;
        star.x = Math.random() * width;
      }

      const dx = this.pointer.x - star.x;
      const dy = this.pointer.y - star.y;
      const distance = Math.hypot(dx, dy);
      const cursorGlow = this.pointer.active && distance < 110 ? 0.55 : 0;
      const twinkle = 0.42 + Math.sin(time * 0.004 + star.phase) * 0.28 + cursorGlow;

      ctx.save();
      ctx.globalAlpha = Math.min(1, twinkle);
      ctx.fillStyle = star.color;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(
        Math.round(star.x + parallaxX * 18),
        Math.round(star.y + parallaxY * 12),
        star.size,
        star.size
      );
      ctx.restore();
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @param {number} parallaxX Pointer x offset.
   * @param {number} parallaxY Pointer y offset.
   * @returns {void}
   */
  drawObjects(ctx, width, height, time, parallaxX, parallaxY) {
    this.objects.forEach((object, index) => {
      const pulse = Math.sin(time * 0.002 + index) * 4;
      const x = object.x + Math.sin(time * 0.0004 + index) * 18 + parallaxX * 34;
      const y = object.y + Math.cos(time * 0.0005 + index) * 12 + parallaxY * 24;

      ctx.save();
      ctx.shadowColor = object.color;
      ctx.shadowBlur = 22;
      ctx.fillStyle = object.color;
      ctx.globalAlpha = 0.52;
      ctx.beginPath();
      ctx.arc(x, y, object.radius + pulse, 0, Math.PI * 2);
      ctx.fill();

      if (object.ring) {
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, object.radius * 1.7, object.radius * 0.42, -0.28, 0, Math.PI * 2);
        ctx.stroke();
      }

      this.drawSatellite(ctx, x + object.radius * 2.4, y - object.radius, time, index);
      ctx.restore();
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} x Satellite x.
   * @param {number} y Satellite y.
   * @param {number} time Animation timestamp.
   * @param {number} index Object index.
   * @returns {void}
   */
  drawSatellite(ctx, x, y, time, index) {
    if (index !== 0) {
      return;
    }

    const offset = Math.sin(time * 0.001) * 10;
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(x + offset, y, 12, 6);
    ctx.fillStyle = "#2ff8ff";
    ctx.fillRect(x - 8 + offset, y + 1, 6, 4);
    ctx.fillRect(x + 14 + offset, y + 1, 6, 4);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @returns {void}
   */
  drawParticles(ctx, width, height, time) {
    this.particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(time * 0.001 + particle.y * 0.01) * 0.2;

      if (particle.y < -10) {
        particle.y = height + 10;
        particle.x = Math.random() * width;
      }

      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      ctx.restore();
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @returns {void}
   */
  drawExplosions(ctx) {
    this.explosions = this.explosions.filter((explosion) => explosion.age < 34);

    this.explosions.forEach((explosion) => {
      explosion.age += 1;
      if (explosion.age < 0) {
        return;
      }

      const radius = explosion.age * 5;

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - explosion.age / 34);
      ctx.strokeStyle = explosion.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = explosion.color;
      ctx.shadowBlur = 14;
      ctx.strokeRect(explosion.x - radius / 2, explosion.y - radius / 2, radius, radius);

      if (explosion.firework) {
        for (let spark = 0; spark < 12; spark += 1) {
          const angle = (Math.PI * 2 * spark) / 12;
          const sparkDistance = radius * 0.72;
          const x = explosion.x + Math.cos(angle) * sparkDistance;
          const y = explosion.y + Math.sin(angle) * sparkDistance;
          ctx.fillStyle = explosion.color;
          ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
        }
      }

      ctx.restore();
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @returns {void}
   */
  drawWarp(ctx, width, height, time) {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 2;

    for (let index = 0; index < 70; index += 1) {
      const angle = index * 2.399;
      const distance = ((time * 0.9 + index * 31) % Math.max(width, height));
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * distance * 0.25, centerY + Math.sin(angle) * distance * 0.25);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @param {number} parallaxX Pointer x offset.
   * @param {number} parallaxY Pointer y offset.
   * @returns {void}
   */
  drawSunsetScene(ctx, width, height, time, parallaxX, parallaxY) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, SUNSET_SKY_COLORS.top);
    sky.addColorStop(0.4, SUNSET_SKY_COLORS.mid);
    sky.addColorStop(0.72, SUNSET_SKY_COLORS.low);
    sky.addColorStop(1, SUNSET_SKY_COLORS.horizon);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sunX = width * 0.5 + parallaxX * 60;
    const sunY = height * 0.23 + parallaxY * 30;
    const sunRadius = Math.max(52, width * 0.07);
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.6);
    sunGlow.addColorStop(0, "rgba(255, 209, 102, 0.95)");
    sunGlow.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - sunRadius * 1.8, sunY - sunRadius * 1.8, sunRadius * 3.6, sunRadius * 3.6);
    ctx.fillStyle = SUNSET_SKY_COLORS.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    this.drawSunsetGrid(ctx, width, height, parallaxX);
    this.drawPalms(ctx, width, height, time, parallaxX);
    this.drawCruiser(ctx, width, height, time, parallaxX);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} parallaxX Pointer x offset.
   * @returns {void}
   */
  drawSunsetGrid(ctx, width, height, parallaxX) {
    const horizonY = height * 0.62;
    ctx.fillStyle = SUNSET_SKY_COLORS.ground;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    ctx.fillStyle = SUNSET_SKY_COLORS.road;
    const roadWidthTop = width * 0.14;
    const roadWidthBottom = width * 0.56;
    ctx.beginPath();
    ctx.moveTo(width / 2 - roadWidthTop / 2, horizonY);
    ctx.lineTo(width / 2 + roadWidthTop / 2, horizonY);
    ctx.lineTo(width / 2 + roadWidthBottom / 2, height);
    ctx.lineTo(width / 2 - roadWidthBottom / 2, height);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    for (let x = -40; x < width + 40; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x + parallaxX * 26, height);
      ctx.lineTo(width / 2 + (x - width / 2) * 0.34, horizonY);
      ctx.stroke();
    }
    for (let y = horizonY + 10; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = SUNSET_SKY_COLORS.roadStripe;
    for (let stripe = 0; stripe < 9; stripe += 1) {
      const t = stripe / 9;
      const y = horizonY + t * (height - horizonY);
      const stripeWidth = 2 + t * 10;
      const stripeHeight = 4 + t * 8;
      ctx.fillRect(width / 2 - stripeWidth / 2, y, stripeWidth, stripeHeight);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @param {number} parallaxX Pointer x offset.
   * @returns {void}
   */
  drawPalms(ctx, width, height, time, parallaxX) {
    const baseY = height * 0.64;
    const sway = Math.sin(time * 0.0016) * 2;
    const palmLocations = [
      { x: width * 0.12 + parallaxX * 10, scale: 1.08 },
      { x: width * 0.22 + parallaxX * 14, scale: 0.82 },
      { x: width * 0.82 + parallaxX * 10, scale: 1.03 },
      { x: width * 0.91 + parallaxX * 14, scale: 0.76 }
    ];

    palmLocations.forEach((palm, index) => {
      const trunkHeight = 120 * palm.scale;
      const trunkWidth = 10 * palm.scale;
      const trunkX = palm.x + Math.sin(time * 0.0012 + index) * 1.5;
      const trunkY = baseY - trunkHeight;

      ctx.save();
      ctx.translate(trunkX, trunkY);
      ctx.fillStyle = "#7b3f00";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(trunkWidth, 0);
      ctx.lineTo(trunkWidth - 6, trunkHeight);
      ctx.lineTo(-6, trunkHeight);
      ctx.closePath();
      ctx.fill();

      const frondCount = 6;
      for (let frond = 0; frond < frondCount; frond += 1) {
        const angle = -1.65 + (frond / (frondCount - 1)) * 2.1;
        const len = 54 * palm.scale + Math.sin(time * 0.0018 + frond) * 5 + sway;
        ctx.strokeStyle = frond % 2 === 0 ? SUNSET_SKY_COLORS.palm : SUNSET_SKY_COLORS.palmAccent;
        ctx.lineWidth = 4 * palm.scale;
        ctx.beginPath();
        ctx.moveTo(trunkWidth * 0.35, 4);
        ctx.lineTo(trunkWidth * 0.35 + Math.cos(angle) * len, 4 + Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx Canvas context.
   * @param {number} width View width.
   * @param {number} height View height.
   * @param {number} time Animation timestamp.
   * @param {number} parallaxX Pointer x offset.
   * @returns {void}
   */
  drawCruiser(ctx, width, height, time, parallaxX) {
    const trackY = height * 0.72;
    const travel = ((time * 0.09) % (width + 280)) - 140;
    const carX = travel + parallaxX * 20;
    const carY = trackY + Math.sin(time * 0.003) * 1.4;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.fillStyle = SUNSET_SKY_COLORS.car;
    ctx.fillRect(-52, -12, 104, 22);
    ctx.fillRect(-34, -26, 68, 16);

    ctx.fillStyle = SUNSET_SKY_COLORS.carDark;
    ctx.fillRect(-28, -22, 56, 10);
    ctx.fillStyle = "#a7f4ff";
    ctx.fillRect(-24, -20, 22, 8);
    ctx.fillRect(4, -20, 20, 8);

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-30, 12, 9, 0, Math.PI * 2);
    ctx.arc(30, 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(-30, 12, 3, 0, Math.PI * 2);
    ctx.arc(30, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 214, 102, 0.65)";
    ctx.beginPath();
    ctx.moveTo(52, -6);
    ctx.lineTo(126, -18);
    ctx.lineTo(126, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
