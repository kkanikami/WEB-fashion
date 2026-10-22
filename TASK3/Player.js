
import { resolveCollisions } from './collision.js';

export class Player {
  constructor(x, groundY) {
    this.w = 30;
    this.h = 42;
    this.spawnX = x;
    this.spawnGroundY = groundY;
    this.groundY = groundY;
    this.speed = 245;
    this.jumpSpeed = 510;
    this.gravity = 1450;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnGroundY - this.h;
    this.previousX = this.x;
    this.previousY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.facing = 1;
    this.walkTime = 0;
    this.jumpWasDown = false;
  }

  update(dt, input, platforms) {
    this.previousX = this.x;
    this.previousY = this.y;

    const direction = Number(input.right) - Number(input.left);
    this.vx = direction * this.speed;

    if (direction !== 0) {
      this.facing = direction;
      this.walkTime += dt * 12;
    }

    const jumpDown = input.jump;
    const jumpPressed = jumpDown && !this.jumpWasDown;
    this.jumpWasDown = jumpDown;

    if (jumpPressed && this.onGround) {
      this.vy = -this.jumpSpeed;
      this.onGround = false;
    }

    this.vy += this.gravity * dt;
    this.vy = Math.min(this.vy, 850);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Левая и правая границы мира.
    this.x = Math.max(0, Math.min(960 - this.w, this.x));

    resolveCollisions(this, platforms, dt);
  }

  draw(ctx) {
    const cx = this.x + this.w / 2;
    const foot = this.y + this.h;
    const walking = this.onGround && Math.abs(this.vx) > 0;
    const step = walking ? Math.sin(this.walkTime) * 3 : 0;

    ctx.save();
    ctx.translate(cx, this.y);
    ctx.scale(this.facing, 1);

    // Мягкая тень.
    ctx.fillStyle = '#627c7970';
    ctx.beginPath();
    ctx.ellipse(0, this.h + 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ноги и ботиночки.
    ctx.strokeStyle = '#75566d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 30);
    ctx.lineTo(-5 + step, 37);
    ctx.moveTo(5, 30);
    ctx.lineTo(5 - step, 37);
    ctx.stroke();

    ctx.fillStyle = '#d98e9c';
    ctx.beginPath();
    ctx.ellipse(-5 + step, 39, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(5 - step, 39, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Платье.
    ctx.fillStyle = '#ce8fc9';
    ctx.beginPath();
    ctx.moveTo(-7, 19);
    ctx.lineTo(-12, 32);
    ctx.lineTo(12, 32);
    ctx.lineTo(7, 19);
    ctx.closePath();
    ctx.fill();

    // Воротничок.
    ctx.fillStyle = '#fff1d8';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(0, 23);
    ctx.lineTo(6, 18);
    ctx.lineTo(4, 16);
    ctx.lineTo(-4, 16);
    ctx.closePath();
    ctx.fill();

    // Рукава и руки.
    ctx.strokeStyle = '#f5c8ad';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-7, 20);
    ctx.lineTo(-11, 27 + step * 0.4);
    ctx.moveTo(7, 20);
    ctx.lineTo(11, 27 - step * 0.4);
    ctx.stroke();

    // Голова.
    ctx.fillStyle = '#f4c8a9';
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Волосы.
    ctx.fillStyle = '#795444';
    ctx.beginPath();
    ctx.arc(0, 8, 11, Math.PI, Math.PI * 2);
    ctx.lineTo(11, 14);
    ctx.lineTo(7, 17);
    ctx.lineTo(6, 10);
    ctx.lineTo(0, 13);
    ctx.lineTo(-7, 10);
    ctx.lineTo(-8, 17);
    ctx.lineTo(-11, 13);
    ctx.closePath();
    ctx.fill();

    // Глаз и румянец.
    ctx.fillStyle = '#51445f';
    ctx.beginPath();
    ctx.arc(4, 12, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e99aab';
    ctx.beginPath();
    ctx.ellipse(6, 16, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Маленький цветок в волосах.
    ctx.fillStyle = '#fff2a9';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ctx.beginPath();
      ctx.arc(-6 + Math.cos(a) * 3, 7 + Math.sin(a) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
