/*
  ==================================================================
  main.js — AIROZ UNIVERSE
  
  Main JavaScript file that handles interactive behavior:
  
  FEATURES:
  1) Mobile navigation toggle
     - Toggles `aria-expanded` on the menu button
     - Toggles `aria-hidden` on the primary nav list
  
  2) Skip-link helper
     - Moves keyboard focus to main content when skip link is used
  
  The code is organized into small functions with clear names so it's
  easy to read, maintain, and extend.
  ================================================================== */

'use strict';

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Safe query helper: returns the element or null.
 * This is a tiny wrapper to make intent clear when scanning the code.
 */
function $(selector) {
  return document.querySelector(selector);
}


// ==================================================================
// NAVIGATION SETUP
// ==================================================================

/**
 * setupNavToggle
 * - Finds the menu toggle button and the primary nav element.
 * - Ensures ARIA attributes are initialized.
 * - Adds a click listener to toggle open/closed state.
 *
 * Why we do this: visually hiding/showing the nav for small screens is
 * controlled by CSS, but we must update ARIA attributes so screen readers
 * and keyboard users know whether the menu is open.
 */
function setupNavToggle() {
  var button = $('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (!button || !nav) {
    // If either element is missing, nothing to do.
    return;
  }

  // Ensure attributes have sensible defaults so state is predictable.
  if (!button.hasAttribute('aria-expanded')) {
    button.setAttribute('aria-expanded', 'false');
  }

  if (!nav.hasAttribute('aria-hidden')) {
    nav.setAttribute('aria-hidden', 'true');
  }

  // Toggle function separated for readability and potential reuse.
  function toggleMenu() {
    var currentlyExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!currentlyExpanded));

    var currentlyHidden = nav.getAttribute('aria-hidden') === 'true';
    nav.setAttribute('aria-hidden', String(!currentlyHidden));
  }

  button.addEventListener('click', toggleMenu);
}


// ==================================================================
// SKIP LINK SETUP
// ==================================================================

/**
 * setupSkipLink
 * - Makes the "skip to content" link move keyboard focus to the target
 *   element. This helps keyboard users and older browsers which may not
 *   move focus automatically when an in-page anchor is clicked.
 *
 * Notes for beginners:
 * - We add a temporary tabindex so the element can receive focus.
 * - We do not remove the tabindex afterwards because leaving it is harmless
 *   and keeps the element focusable for keyboard users.
 */
function setupSkipLink() {
  var skip = $('.skip-link');
  if (!skip) return;

  skip.addEventListener('click', function (event) {
    // The href is expected to be like "#main". slice(1) removes the '#'.
    var targetId = skip.getAttribute('href').slice(1);
    if (!targetId) return;

    var target = document.getElementById(targetId);
    if (!target) return;

    // Make sure the target can be focused, then focus it.
    target.setAttribute('tabindex', '-1');
    target.focus();
  });
}





// ==================================================================
// INITIALIZATION
// ==================================================================

/**
 * init()
 * - Entry point run when the DOM is ready
 * - Calls all setup functions in order
 */
function init() {
  setupNavToggle();
  setupSkipLink();
}


// ==================================================================
// DOM READY CHECK & INITIALIZATION TRIGGER
// ==================================================================

// Run init when DOM is fully loaded. This ensures all elements exist.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready
  init();
}


