/**
 * 2D Spatial Navigation Engine
 * Computes directional focus transitions based on Euclidean geometric projection.
 * Designed for 10-foot TV interfaces and remote D-pad interaction.
 */

(function(global) {
  'use strict';

  var FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), .focusable';

  var SpatialNav = {
    activeContainer: null,
    currentFocusedElement: null,
    historyPerContainer: {},

    /**
     * Set the active focusable container (e.g. for modals or keyboard)
     * @param {Element|string|null} container
     */
    setContainer: function(container) {
      if (typeof container === 'string') {
        this.activeContainer = document.querySelector(container);
      } else {
        this.activeContainer = container || null;
      }
    },

    /**
     * Get all visible, focusable elements within the active scope
     * @returns {Element[]}
     */
    getFocusableElements: function() {
      var root = this.activeContainer || document.body;
      if (!root) return [];

      var nodes = root.querySelectorAll(FOCUSABLE_SELECTOR);
      var visibleNodes = [];

      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (this.isVisible(el)) {
          visibleNodes.push(el);
        }
      }

      return visibleNodes;
    },

    /**
     * Check if an element is visible in the viewport
     * @param {Element} el
     * @returns {boolean}
     */
    isVisible: function(el) {
      if (!el || el.offsetParent === null) return false;
      var style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    },

    /**
     * Focus a specific element with smooth scrolling and outline
     * @param {Element} el
     */
    focus: function(el) {
      if (!el) return;
      this.currentFocusedElement = el;
      el.focus();

      // Ensure visible in TV viewport
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch (e) {
        el.scrollIntoView(false);
      }
    },

    /**
     * Initialize focus on the first available focusable element
     * @param {Element} [preferredElement]
     */
    initFocus: function(preferredElement) {
      if (preferredElement && this.isVisible(preferredElement)) {
        this.focus(preferredElement);
        return;
      }

      var elements = this.getFocusableElements();
      if (elements.length > 0) {
        this.focus(elements[0]);
      }
    },

    /**
     * Navigate focus in a cardinal direction ('UP', 'DOWN', 'LEFT', 'RIGHT')
     * @param {string} direction
     * @returns {boolean} Whether focus was shifted
     */
    move: function(direction) {
      var current = document.activeElement || this.currentFocusedElement;
      var elements = this.getFocusableElements();

      if (elements.length === 0) return false;

      if (!current || elements.indexOf(current) === -1) {
        this.focus(elements[0]);
        return true;
      }

      var currentRect = current.getBoundingClientRect();
      var bestCandidate = null;
      var minDistance = Infinity;

      for (var i = 0; i < elements.length; i++) {
        var candidate = elements[i];
        if (candidate === current) continue;

        var targetRect = candidate.getBoundingClientRect();
        var score = this.calculateDirectionScore(currentRect, targetRect, direction);

        if (score !== null && score < minDistance) {
          minDistance = score;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        this.focus(bestCandidate);
        return true;
      }

      return false;
    },

    /**
     * Calculate Euclidean distance weighted by directional cone
     * @param {DOMRect} cur
     * @param {DOMRect} target
     * @param {string} dir
     * @returns {number|null} Score (lower is better), or null if wrong direction
     */
    calculateDirectionScore: function(cur, target, dir) {
      var curCenter = { x: cur.left + cur.width / 2, y: cur.top + cur.height / 2 };
      var tarCenter = { x: target.left + target.width / 2, y: target.top + target.height / 2 };

      var dx = tarCenter.x - curCenter.x;
      var dy = tarCenter.y - curCenter.y;

      // Filter by quadrant
      if (dir === 'LEFT' && dx >= -5) return null;
      if (dir === 'RIGHT' && dx <= 5) return null;
      if (dir === 'UP' && dy >= -5) return null;
      if (dir === 'DOWN' && dy <= 5) return null;

      // Primary distance and perpendicular penalty
      var primaryDist, perpDist;
      if (dir === 'LEFT' || dir === 'RIGHT') {
        primaryDist = Math.abs(dx);
        perpDist = Math.abs(dy);
      } else {
        primaryDist = Math.abs(dy);
        perpDist = Math.abs(dx);
      }

      // Check for collinear alignment bonus
      var overlap = 0;
      if (dir === 'LEFT' || dir === 'RIGHT') {
        overlap = Math.max(0, Math.min(cur.bottom, target.bottom) - Math.max(cur.top, target.top));
      } else {
        overlap = Math.max(0, Math.min(cur.right, target.right) - Math.max(cur.left, target.left));
      }

      var overlapBonus = overlap > 0 ? 0.6 : 1.4;
      return (primaryDist + perpDist * 2.5) * overlapBonus;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialNav;
  } else {
    global.SpatialNav = SpatialNav;
  }
})(typeof window !== 'undefined' ? window : this);
