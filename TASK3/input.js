
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = new Set();

    this.onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const controls = [
        'arrowleft', 'arrowright', 'arrowup',
        ' ', 'a', 'd', 'w'
      ];

      if (!controls.includes(key)) return;

      if (document.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault();
      }

      if (!event.repeat) this.keys.add(key);
    };

    this.onKeyUp = (event) => {
      this.keys.delete(event.key.toLowerCase());
    };

    this.onBlur = () => this.clear();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    this.touchButtons = document.querySelectorAll('[data-control]');

    this.touchButtons.forEach((button) => {
      const control = button.dataset.control;

      const down = (event) => {
        event.preventDefault();
        this.touch.add(control);
        button.classList.add('pressed');

        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // Захват указателя поддерживается не во всех браузерах.
        }
      };

      const up = (event) => {
        event.preventDefault();
        this.touch.delete(control);
        button.classList.remove('pressed');
      };

      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
      });
    });
  }

  get left() {
    return this.keys.has('arrowleft') ||
      this.keys.has('a') || this.touch.has('left');
  }

  get right() {
    return this.keys.has('arrowright') ||
      this.keys.has('d') || this.touch.has('right');
  }

  get jump() {
    return this.keys.has(' ') ||
      this.keys.has('arrowup') ||
      this.keys.has('w') || this.touch.has('jump');
  }

  clear() {
    this.keys.clear();
    this.touch.clear();

    this.touchButtons.forEach((button) => {
      button.classList.remove('pressed');
    });
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.clear();
  }
}
