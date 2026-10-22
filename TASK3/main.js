
import { Game } from './Game.js';
import { Input } from './input.js';

const canvas = document.querySelector('#game-canvas');

const ui = {
  score: document.querySelector('#score'),
  bestScore: document.querySelector('#best-score'),
  overlay: document.querySelector('#overlay'),
  overlayIcon: document.querySelector('#overlay-icon'),
  overlayTitle: document.querySelector('#overlay-title'),
  overlayText: document.querySelector('#overlay-text'),
  startButton: document.querySelector('#start-button'),
  pauseButton: document.querySelector('#pause-button'),
  restartButton: document.querySelector('#restart-button')
};

const input = new Input();
const game = new Game(canvas, input, ui);

ui.startButton.onclick = () => {
  if (game.state === 'paused') {
    game.resume();
  } else {
    game.start();
  }
};

ui.pauseButton.addEventListener('click', () => {
  if (game.state === 'playing') {
    game.pause();
  } else if (game.state === 'paused') {
    game.resume();
  }
});

ui.restartButton.addEventListener('click', () => {
  game.restart();
});

// Останавливаем ввод при уходе со страницы.
window.addEventListener('pagehide', () => {
  input.clear();
});

// Очистка ресурсов, если модуль выгружается.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy();
    input.destroy();
  });
}
