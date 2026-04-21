const STAR_COLORS = ["#f8fbff", "#2ff8ff", "#ff3df2", "#9b5cff", "#4aa8ff"];

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
    this.drawGrid(ctx, width, height, parallaxX);
    this.drawStars(ctx, width, height, time, parallaxX, parallaxY);
    this.drawObjects(ctx, width, height, time, parallaxX, parallaxY);
    this.drawParticles(ctx, width, height, time);
    this.drawExplosions(ctx);

    if (time < this.warpUntil) {
      this.drawWarp(ctx, width, height, time);
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
   * @returns {void}
   */
  drawParticles(ctx, width, height) {
    this.particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(particle.y * 0.01) * 0.2;

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
}
