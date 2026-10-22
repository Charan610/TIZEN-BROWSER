/**
 * Virtual Pointer Controller
 * Allows Samsung TV remote D-pad to smoothly steer a hardware-accelerated cursor
 * with time-delta velocity ramping and synthetic click dispatch.
 */

(function(global) {
  'use strict';

  var PointerMode = {
    active: false,
    x: 960,
    y: 540,
    vx: 0,
    vy: 0,
    cursorEl: null,
    animFrameId: null,
    lastTime: 0,
    keysDown: { UP: false, DOWN: false, LEFT: false, RIGHT: false },

    // Kinematic parameters
    ACCELERATION: 1800, // px / s^2
    MAX_SPEED: 950,     // px / s
    FRICTION: 0.88,     // Damping factor

    init: function() {
      if (typeof document === 'undefined') return;

      if (!document.getElementById('virtual-cursor')) {
        this.cursorEl = document.createElement('div');
        this.cursorEl.id = 'virtual-cursor';
        this.cursorEl.className = 'virtual-cursor hidden';
        this.cursorEl.innerHTML = '<svg viewBox="0 0 24 24" class="cursor-svg"><path d="M4 2l16 12-7.5.5L18 22l-4 1.5-5.5-8L4 18V2z" fill="#38bdf8" stroke="#000" stroke-width="1.5"/></svg>';
        document.body.appendChild(this.cursorEl);
      } else {
        this.cursorEl = document.getElementById('virtual-cursor');
      }

      this.updateCursorPosition();
    },

    toggle: function() {
      if (this.active) {
        this.disable();
      } else {
        this.enable();
      }
      return this.active;
    },

    enable: function() {
      this.active = true;
      if (this.cursorEl) {
        this.cursorEl.classList.remove('hidden');
      }
      this.lastTime = performance.now();
      this.startLoop();
      console.log('[PointerMode] Enabled');
    },

    disable: function() {
      this.active = false;
      this.stopLoop();
      if (this.cursorEl) {
        this.cursorEl.classList.add('hidden');
      }
      this.keysDown = { UP: false, DOWN: false, LEFT: false, RIGHT: false };
      console.log('[PointerMode] Disabled');
    },

    handleKeyDown: function(action) {
      if (!this.active) return false;

      if (action === 'UP') { this.keysDown.UP = true; return true; }
      if (action === 'DOWN') { this.keysDown.DOWN = true; return true; }
      if (action === 'LEFT') { this.keysDown.LEFT = true; return true; }
      if (action === 'RIGHT') { this.keysDown.RIGHT = true; return true; }

      if (action === 'ENTER') {
        this.dispatchClick();
        return true;
      }

      return false;
    },

    handleKeyUp: function(action) {
      if (!this.active) return false;

      if (action === 'UP') { this.keysDown.UP = false; return true; }
      if (action === 'DOWN') { this.keysDown.DOWN = false; return true; }
      if (action === 'LEFT') { this.keysDown.LEFT = false; return true; }
      if (action === 'RIGHT') { this.keysDown.RIGHT = false; return true; }

      return false;
    },

    startLoop: function() {
      var self = this;
      function tick(now) {
        if (!self.active) return;
        var dt = Math.min((now - self.lastTime) / 1000, 0.1);
        self.lastTime = now;
        self.updateKinematics(dt);
        self.animFrameId = requestAnimationFrame(tick);
      }
      this.animFrameId = requestAnimationFrame(tick);
    },

    stopLoop: function() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    },

    updateKinematics: function(dt) {
      var ax = 0;
      var ay = 0;

      if (this.keysDown.LEFT) ax -= this.ACCELERATION;
      if (this.keysDown.RIGHT) ax += this.ACCELERATION;
      if (this.keysDown.UP) ay -= this.ACCELERATION;
      if (this.keysDown.DOWN) ay += this.ACCELERATION;

      // Apply acceleration
      this.vx += ax * dt;
      this.vy += ay * dt;

      // Apply friction when no input
      if (ax === 0) this.vx *= this.FRICTION;
      if (ay === 0) this.vy *= this.FRICTION;

      // Cap speed
      var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.MAX_SPEED) {
        var ratio = this.MAX_SPEED / speed;
        this.vx *= ratio;
        this.vy *= ratio;
      }

      // Update position
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Bound to viewport (1920x1080)
      var maxW = window.innerWidth || 1920;
      var maxH = window.innerHeight || 1080;
      this.x = Math.max(0, Math.min(maxW, this.x));
      this.y = Math.max(0, Math.min(maxH, this.y));

      this.updateCursorPosition();
    },

    updateCursorPosition: function() {
      if (!this.cursorEl) return;
      this.cursorEl.style.transform = 'translate3d(' + Math.round(this.x) + 'px, ' + Math.round(this.y) + 'px, 0)';
    },

    dispatchClick: function() {
      if (!this.active) return;

      // Hide cursor momentarily to find underlying element
      this.cursorEl.style.display = 'none';
      var target = document.elementFromPoint(this.x, this.y);
      this.cursorEl.style.display = '';

      if (target) {
        console.log('[PointerMode] Click dispatched to:', target.tagName, target.id || target.className);
        
        var mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: this.x, clientY: this.y });
        var mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: this.x, clientY: this.y });
        var click = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: this.x, clientY: this.y });

        target.dispatchEvent(mousedown);
        target.dispatchEvent(mouseup);
        target.dispatchEvent(click);

        // If target is an input, focus it
        if (typeof target.focus === 'function') {
          target.focus();
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PointerMode;
  } else {
    global.PointerMode = PointerMode;
  }
})(typeof window !== 'undefined' ? window : this);
