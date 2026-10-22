
import { Player } from './Player.js';

const WIDTH = 960;
const HEIGHT = 540;

export class Game {
  constructor(canvas, input, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.ui = ui;

    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;

    this.state = 'ready';
    this.score = 0;
    this.bestScore = this.loadBest();
    this.lastTime = null;
    this.frameId = null;
    this.animation = 0;
    this.player = null;

    this.platforms = [
      { x: 0, y: 470, w: 960, h: 70, ground: true },
      { x: 95, y: 400, w: 125, h: 18 },
      { x: 265, y: 340, w: 125, h: 18 },
      { x: 430, y: 390, w: 125, h: 18 },
      { x: 600, y: 325, w: 130, h: 18 },
      { x: 775, y: 385, w: 115, h: 18 }
    ];

    this.hazards = [
      { x: 375, y: 454, w: 65, h: 16 },
      { x: 555, y: 454, w: 60, h: 16 }
    ];

    this.crystalStarts = [
      { x: 157, y: 355 },
      { x: 323, y: 292 },
      { x: 655, y: 278 }
    ];

    this.crystals = [];
    this.resetLevel();
    this.updateUI();
    this.draw();

    // Единственный постоянно работающий RAF-цикл.
    this.loop = (time) => {
      if (this.state === 'playing') {
        if (this.lastTime === null) this.lastTime = time;

        const dt = Math.min((time - this.lastTime) / 1000, 0.033);
        this.lastTime = time;

        this.update(dt);
      } else {
        this.lastTime = null;
      }

      this.draw();
      this.animation = requestAnimationFrame(this.loop);
    };

    this.animation = requestAnimationFrame(this.loop);

    this.onVisibilityChange = () => {
      if (document.hidden) {
        this.input.clear();

        if (this.state === 'playing') {
          this.pause();
        }
      } else {
        this.lastTime = null;
      }
    };

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  loadBest() {
    try {
      return Math.max(0, Number(localStorage.getItem('littleJourneyBest')) || 0);
    } catch {
      return 0;
    }
  }

  saveBest() {
    try {
      localStorage.setItem('littleJourneyBest', String(this.bestScore));
    } catch {
      // Игра продолжает работать, даже если хранилище недоступно.
    }
  }

  resetLevel() {
    this.score = 0;
    this.player = new Player(35, 470);
    this.crystals = this.crystalStarts.map((item) => ({
      ...item,
      collected: false,
      phase: Math.random() * Math.PI * 2
    }));
    this.updateUI();
  }

  start() {
    this.input.clear();
    this.resetLevel();
    this.state = 'playing';
    this.lastTime = null;
    this.ui.overlay.classList.add('hidden');
    this.ui.pauseButton.disabled = false;
    this.ui.pauseButton.textContent = 'Ⅱ Пауза';
    this.canvas.focus({ preventScroll: true });
  }

  pause() {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.lastTime = null;
    this.input.clear();
    this.ui.pauseButton.textContent = '▶ Продолжить';

    this.showOverlay(
      'Ⅱ',
      'Небольшая передышка',
      'Долина подождёт. Когда будешь готова, продолжай путешествие.',
      'Продолжить ✦',
      () => this.resume()
    );
  }

  resume() {
    if (this.state !== 'paused') return;

    this.input.clear();
    this.state = 'playing';
    this.lastTime = null;
    this.ui.overlay.classList.add('hidden');
    this.ui.pauseButton.textContent = 'Ⅱ Пауза';
    this.canvas.focus({ preventScroll: true });
  }

  restart() {
    this.input.clear();
    this.state = 'ready';
    this.lastTime = null;
    this.resetLevel();
    this.ui.pauseButton.disabled = true;
    this.ui.pauseButton.textContent = 'Ⅱ Пауза';

    this.showOverlay(
      '✿',
      'Начнём сначала?',
      'Собери три волшебных кристалла и найди дорогу к домику.',
      'Начать путешествие ✦',
      () => this.start()
    );
  }

  showOverlay(icon, title, message, buttonText, action) {
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayIcon.textContent = icon;
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayText.textContent = message;
    this.ui.startButton.textContent = buttonText;

    // Заменяем действие кнопки, не добавляя новых обработчиков.
    this.ui.startButton.onclick = action;
  }

  finish(won) {
    if (this.state !== 'playing') return;

    this.state = won ? 'won' : 'lost';
    this.lastTime = null;
    this.input.clear();
    this.ui.pauseButton.disabled = true;

    if (won && this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBest();
    }

    this.updateUI();

    if (won) {
      this.showOverlay(
        '🏡',
        'Ура, ты дома!',
        'Все кристаллы собраны! Маленькое путешествие завершилось большим чудом.',
        'Играть снова ↻',
        () => this.start()
      );
    } else {
      this.showOverlay(
        '♡',
        'Попробуем ещё раз?',
        'Впереди ещё много чудес. Начни заново и попробуй добраться до домика.',
        'Попробовать снова ↻',
        () => this.start()
      );
    }
  }

  updateUI() {
    this.ui.score.textContent = `${this.score} / ${this.crystals.length}`;
    this.ui.bestScore.textContent = String(this.bestScore);
  }

  update(dt) {
    this.animation += dt;

    this.player.update(dt, this.input, this.platforms);

    for (const crystal of this.crystals) {
      if (crystal.collected) continue;

      const hitbox = {
        x: crystal.x - 12,
        y: crystal.y - 12,
        w: 24,
        h: 24
      };

      const p = this.player;
      const intersects =
        p.x < hitbox.x + hitbox.w &&
        p.x + p.w > hitbox.x &&
        p.y < hitbox.y + hitbox.h &&
        p.y + p.h > hitbox.y;

      if (intersects) {
        crystal.collected = true;
        this.score++;
        this.updateUI();
      }
    }

    // Опасность: шипы на земле.
    const p = this.player;
    for (const hazard of this.hazards) {
      const touchesHazard =
        p.x + p.w > hazard.x &&
        p.x < hazard.x + hazard.w &&
        p.y + p.h > hazard.y &&
        p.y + p.h < hazard.y + hazard.h + 12;

      if (touchesHazard && p.y + p.h >= hazard.y) {
        this.finish(false);
        return;
      }
    }

    // Падение за нижнюю границу уровня.
    if (p.y > HEIGHT + 40) {
      this.finish(false);
      return;
    }

    // Победа — только после сбора всех кристаллов.
    const atHome = p.x + p.w >= 915 && p.y + p.h >= 420;

    if (atHome && this.score === this.crystals.length) {
      this.finish(true);
    }
  }

  polygon(points, fill, stroke = null) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }

    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  drawBackground() {
    const ctx = this.ctx;

    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#bce8ed');
    sky.addColorStop(0.7, '#e1f2d9');
    sky.addColorStop(1, '#fff0d5');

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Далёкие low-poly холмы.
    this.polygon(
      [[0, 310], [100, 230], [190, 300], [300, 215],
       [410, 305], [520, 235], [650, 305], [770, 220],
       [900, 300], [960, 250], [960, 470], [0, 470]],
      '#b3dbc4'
    );

    this.polygon(
      [[0, 365], [125, 285], [245, 365], [380, 280],
       [505, 370], [665, 285], [790, 360], [900, 290],
       [960, 330], [960, 470], [0, 470]],
      '#9ecbb0'
    );

    // Облака.
    this.drawCloud(145, 105, 1);
    this.drawCloud(485, 80, 0.8);
    this.drawCloud(785, 140, 1.15);

    // Маленькие парящие звёздочки.
    for (let i = 0; i < 16; i++) {
      const x = (i * 173 + 47) % WIDTH;
      const y = 40 + (i * 67) % 235;

      ctx.fillStyle = i % 2 ? '#fff6cfaa' : '#ffffffb0';
      ctx.beginPath();
      ctx.arc(x, y + Math.sin(this.animation * 0.2 + i) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Декоративные цветы на дальнем плане.
    for (let i = 0; i < 20; i++) {
      const x = (i * 59 + 18) % WIDTH;
      const y = 444 + Math.sin(i * 3) * 7;
      this.drawFlower(x, y, 0.5);
    }
  }

  drawCloud(x, y, scale) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y + Math.sin(this.animation * 0.1 + x) * 3);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffffc9';
    ctx.beginPath();
    ctx.ellipse(0, 10, 35, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(-15, 1, 17, 17, 0, 0, Math.PI * 2);
    ctx.ellipse(3, -6, 22, 23, 0, 0, Math.PI * 2);
    ctx.ellipse(23, 4, 17, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawFlower(x, y, scale = 1) {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.strokeStyle = '#729d76';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -9);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ctx.fillStyle = i % 2 ? '#f4bddb' : '#fff0b2';
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * 4,
        -11 + Math.sin(a) * 4,
        3.5, 3.5, a, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = '#e8ba60';
    ctx.beginPath();
    ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPlatform(platform) {
    const ctx = this.ctx;
    const { x, y, w, h } = platform;

    if (platform.ground) {
      ctx.fillStyle = '#8ac49a';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#a9d9a9';
      ctx.fillRect(x, y, w, 9);

      this.polygon(
        [[x, y + 9], [x + 90, y + 9], [x + 130, y + 20],
         [x + 210, y + 9], [x + 290, y + 15],
         [x + 370, y + 9], [x + w, y + 9],
         [x + w, y + h], [x, y + h]],
        '#c9b7a0'
      );

      for (let i = 0; i < 45; i++) {
        const px = (i * 83 + 21) % WIDTH;
        const py = y + 22 + (i * 17) % 45;
        ctx.fillStyle = i % 2 ? '#b4a18f' : '#d9c8b1';
        ctx.fillRect(px, py, 3, 3);
      }

      return;
    }

    // Тень под платформой.
    ctx.fillStyle = '#577f7360';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 9, w * 0.47, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Каменная low-poly основа.
    this.polygon(
      [[x, y + 5], [x + 12, y + h], [x + w - 8, y + h],
       [x + w, y + 5], [x + w - 9, y + 12], [x + 8, y + 12]],
      '#b6a6d0'
    );

    this.polygon(
      [[x, y + 5], [x + 13, y], [x + w - 8, y],
       [x + w, y + 5], [x + w - 8, y + 13], [x + 8, y + 13]],
      '#83c79c'
    );

    ctx.fillStyle = '#b8e2ae';
    ctx.fillRect(x + 13, y + 3, w - 26, 3);

    this.drawFlower(x + 20, y + 1, 0.55);
    this.drawFlower(x + w - 18, y + 1, 0.45);
  }

  drawCrystal(crystal) {
    if (crystal.collected) return;

    const ctx = this.ctx;
    const bob = Math.sin(this.animation * 0.2 + crystal.phase) * 5;
    const x = crystal.x;
    const y = crystal.y + bob;

    ctx.save();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    this.polygon(
      [[x, y - 15], [x + 10, y - 3], [x + 5, y + 13],
       [x - 5, y + 13], [x - 10, y - 3]],
      '#a38ce8'
    );

    this.polygon(
      [[x, y - 15], [x + 10, y - 3], [x, y + 2]],
      '#e4caff'
    );

    this.polygon(
      [[x, y - 15], [x, y + 2], [x - 10, y - 3]],
      '#fff2ff'
    );

    this.polygon(
      [[x, y + 2], [x + 5, y + 13], [x, y + 10]],
      '#856bd0'
    );

    ctx.restore();
  }

  drawHazard(hazard) {
    const ctx = this.ctx;
    const count = Math.max(1, Math.floor(hazard.w / 13));

    ctx.fillStyle = '#e59eac';
    ctx.fillRect(hazard.x, hazard.y + 10, hazard.w, 6);

    for (let i = 0; i < count; i++) {
      const x = hazard.x + i * hazard.w / count;
      const w = hazard.w / count;

      this.polygon(
        [[x, hazard.y + 11], [x + w / 2, hazard.y],
         [x + w, hazard.y + 11]],
        '#e986a2'
      );

      this.polygon(
        [[x + w / 2, hazard.y], [x + w, hazard.y + 11],
         [x + w / 2, hazard.y + 8]],
        '#f7bacb'
      );
    }
  }

  drawHome() {
    const ctx = this.ctx;
    const x = 886;
    const y = 406;

    // Дорожка к домику.
    ctx.fillStyle = '#f4dfba';
    ctx.fillRect(902, 444, 30, 26);

    // Стены.
    ctx.fillStyle = '#f5d5b5';
    ctx.fillRect(x, y + 21, 51, 42);

    // Крыша.
    this.polygon(
      [[x - 8, y + 25], [x + 25, y], [x + 59, y + 25]],
      '#d98fb1'
    );

    this.polygon(
      [[x - 8, y + 25], [x + 25, y], [x + 25, y + 12]],
      '#efb6d0'
    );

    // Дверь и окно.
    ctx.fillStyle = '#9874a8';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 39, 15, 24, 6, 6);
    ctx.fill();

    ctx.fillStyle = '#d4f1ed';
    ctx.fillRect(x + 5, y + 32, 11, 11);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10.5, y + 32);
    ctx.lineTo(x + 10.5, y + 43);
    ctx.moveTo(x + 5, y + 37.5);
    ctx.lineTo(x + 16, y + 37.5);
    ctx.stroke();

    // Дым из трубы.
    ctx.fillStyle = '#ffffffaa';
    const smokeY = y - 8 - (this.animation * 12 % 16);
    ctx.beginPath();
    ctx.arc(x + 41, smokeY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Надпись над финишем.
    ctx.fillStyle = '#fffdf2';
    ctx.beginPath();
    ctx.roundRect(x - 13, y - 32, 77, 21, 7, 7);
    ctx.fill();

    ctx.fillStyle = '#9474ad';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ДОМИК', x + 25, y - 18);
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.drawBackground();

    // Домик рисуется за платформами, чтобы оставаться частью пейзажа.
    this.drawHome();

    for (const platform of this.platforms) {
      this.drawPlatform(platform);
    }

    for (const hazard of this.hazards) {
      this.drawHazard(hazard);
    }

    for (const crystal of this.crystals) {
      this.drawCrystal(crystal);
    }

    if (this.player) {
      this.player.draw(ctx);
    }

    // Подсказка цели.
    if (this.state === 'playing' && this.score < this.crystals.length) {
      ctx.fillStyle = '#ffffffd9';
      ctx.beginPath();
      ctx.roundRect(695, 18, 244, 30, 10, 10);
      ctx.fill();

      ctx.fillStyle = '#81728e';
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Собери все кристаллы ✦', 817, 37);
    }
  }

  destroy() {
    if (this.animation !== null) {
      cancelAnimationFrame(this.animation);
      this.animation = null;
    }

    document.removeEventListener(
      'visibilitychange',
      this.onVisibilityChange
    );
  }
}
