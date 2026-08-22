/**
 * DOM Utility Functions
 * 
 * Reusable DOM manipulation and querying utilities.
 * Replaces repetitive `document.querySelector()` calls and DOM updates.
 * 
 * Usage:
 *   import { query, queryAll, setText, addClass, removeElement } from './dom-utils.js';
 *   setText('#username', user.name);
 *   addClass('#status', 'active');
 */

import logger from './logger.js';

// ============================================================================
// QUERYING
// ============================================================================

/**
 * Query single element with error handling
 * @param {string} selector - CSS selector
 * @returns {Element|null} Element or null if not found
 */
export function query(selector) {
  if (!selector) {
    logger.warn('query called with empty selector');
    return null;
  }
  
  try {
    return document.querySelector(selector);
  } catch (error) {
    logger.error('Invalid selector', { selector, error });
    return null;
  }
}

/**
 * Query all matching elements
 * @param {string} selector - CSS selector
 * @returns {NodeList} All matching elements
 */
export function queryAll(selector) {
  if (!selector) {
    return document.querySelectorAll('');  // Returns empty NodeList
  }
  
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    logger.error('Invalid selector', { selector, error });
    return document.querySelectorAll('');  // Return empty NodeList
  }
}

/**
 * Get element by ID (optimized)
 * @param {string} id - Element ID
 * @returns {Element|null}
 */
export function byId(id) {
  return document.getElementById(id);
}

/**
 * Get closest parent matching selector
 * @param {Element} element - Starting element
 * @param {string} selector - CSS selector to match
 * @returns {Element|null} First matching ancestor or null
 */
export function closest(element, selector) {
  if (!element || !selector) return null;
  return element.closest(selector);
}

// ============================================================================
// TEXT & CONTENT
// ============================================================================

/**
 * Set element text content safely
 * @param {string|Element} target - Selector or element
 * @param {string} text - Text to set
 * @returns {boolean} Whether operation succeeded
 */
export function setText(target, text) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.textContent = String(text ?? '');
    return true;
  } catch (error) {
    logger.warn('Failed to set text', { error });
    return false;
  }
}

/**
 * Get element text content
 * @param {string|Element} target - Selector or element
 * @returns {string} Text content or empty string
 */
export function getText(target) {
  const element = getElement(target);
  return element?.textContent?.trim() || '';
}

/**
 * Set element HTML (use with caution - only with trusted content)
 * @param {string|Element} target - Selector or element
 * @param {string} html - HTML string (must be trusted/sanitized)
 * @returns {boolean}
 */
export function setHTML(target, html) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.innerHTML = html;
    return true;
  } catch (error) {
    logger.warn('Failed to set HTML', { error });
    return false;
  }
}

/**
 * Get element HTML
 * @param {string|Element} target - Selector or element
 * @returns {string} HTML or empty string
 */
export function getHTML(target) {
  const element = getElement(target);
  return element?.innerHTML || '';
}

/**
 * Safely append text node to element
 * @param {string|Element} target - Target element
 * @param {string} text - Text to append
 * @returns {boolean}
 */
export function appendText(target, text) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.appendChild(document.createTextNode(String(text)));
    return true;
  } catch (error) {
    logger.warn('Failed to append text', { error });
    return false;
  }
}

// ============================================================================
// ATTRIBUTES
// ============================================================================

/**
 * Get element attribute
 * @param {string|Element} target - Selector or element
 * @param {string} name - Attribute name
 * @returns {string|null}
 */
export function getAttribute(target, name) {
  const element = getElement(target);
  return element?.getAttribute(name) || null;
}

/**
 * Set element attribute
 * @param {string|Element} target - Selector or element
 * @param {string} name - Attribute name
 * @param {string} value - Attribute value
 * @returns {boolean}
 */
export function setAttribute(target, name, value) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.setAttribute(name, String(value));
    return true;
  } catch (error) {
    logger.warn('Failed to set attribute', { attribute: name, error });
    return false;
  }
}

/**
 * Remove attribute
 * @param {string|Element} target - Selector or element
 * @param {string} name - Attribute name
 * @returns {boolean}
 */
export function removeAttribute(target, name) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.removeAttribute(name);
    return true;
  } catch (error) {
    logger.warn('Failed to remove attribute', { attribute: name, error });
    return false;
  }
}

/**
 * Set data attribute
 * @param {string|Element} target - Selector or element
 * @param {string} key - Data key (without 'data-' prefix)
 * @param {string} value - Data value
 * @returns {boolean}
 */
export function setData(target, key, value) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.dataset[key] = String(value);
    return true;
  } catch (error) {
    logger.warn('Failed to set data attribute', { key, error });
    return false;
  }
}

/**
 * Get data attribute
 * @param {string|Element} target - Selector or element
 * @param {string} key - Data key
 * @returns {string|null}
 */
export function getData(target, key) {
  const element = getElement(target);
  return element?.dataset?.[key] || null;
}

// ============================================================================
// CLASSES
// ============================================================================

/**
 * Add class to element
 * @param {string|Element} target - Selector or element
 * @param {string} className - Class name or space-separated names
 * @returns {boolean}
 */
export function addClass(target, className) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.classList.add(...className.split(/\s+/).filter(Boolean));
    return true;
  } catch (error) {
    logger.warn('Failed to add class', { className, error });
    return false;
  }
}

/**
 * Remove class from element
 * @param {string|Element} target - Selector or element
 * @param {string} className - Class name or space-separated names
 * @returns {boolean}
 */
export function removeClass(target, className) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.classList.remove(...className.split(/\s+/).filter(Boolean));
    return true;
  } catch (error) {
    logger.warn('Failed to remove class', { className, error });
    return false;
  }
}

/**
 * Toggle class on element
 * @param {string|Element} target - Selector or element
 * @param {string} className - Class name
 * @param {boolean} force - Optional: force add (true) or remove (false)
 * @returns {boolean} Whether class is now present
 */
export function toggleClass(target, className, force) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    return element.classList.toggle(className, force);
  } catch (error) {
    logger.warn('Failed to toggle class', { className, error });
    return false;
  }
}

/**
 * Check if element has class
 * @param {string|Element} target - Selector or element
 * @param {string} className - Class name
 * @returns {boolean}
 */
export function hasClass(target, className) {
  const element = getElement(target);
  return element?.classList.contains(className) || false;
}

// ============================================================================
// STYLES
// ============================================================================

/**
 * Set element inline styles
 * @param {string|Element} target - Selector or element
 * @param {Object} styles - Style object {property: value}
 * @returns {boolean}
 */
export function setStyles(target, styles) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    Object.entries(styles).forEach(([key, value]) => {
      element.style[key] = value;
    });
    return true;
  } catch (error) {
    logger.warn('Failed to set styles', { error });
    return false;
  }
}

/**
 * Set single style property
 * @param {string|Element} target - Selector or element
 * @param {string} property - CSS property name
 * @param {string} value - CSS value
 * @returns {boolean}
 */
export function setStyle(target, property, value) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.style[property] = String(value);
    return true;
  } catch (error) {
    logger.warn('Failed to set style', { property, error });
    return false;
  }
}

/**
 * Get computed style property
 * @param {string|Element} target - Selector or element
 * @param {string} property - CSS property name
 * @returns {string}
 */
export function getStyle(target, property) {
  const element = getElement(target);
  return element ? window.getComputedStyle(element)[property] : '';
}

// ============================================================================
// VISIBILITY
// ============================================================================

/**
 * Show element (remove hidden class)
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function show(target) {
  return removeClass(target, 'hidden');
}

/**
 * Hide element (add hidden class)
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function hide(target) {
  return addClass(target, 'hidden');
}

/**
 * Toggle visibility
 * @param {string|Element} target - Selector or element
 * @param {boolean} visible - Optional: force visible
 * @returns {boolean}
 */
export function setVisible(target, visible) {
  return toggleClass(target, 'hidden', !visible);
}

/**
 * Check if element is visible
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function isVisible(target) {
  const element = getElement(target);
  return element !== null && !hasClass(element, 'hidden');
}

// ============================================================================
// FORMS
// ============================================================================

/**
 * Get form input value
 * @param {string|Element} target - Input selector or element
 * @returns {string}
 */
export function getValue(target) {
  const element = getElement(target);
  return element?.value || '';
}

/**
 * Set form input value
 * @param {string|Element} target - Input selector or element
 * @param {string} value - Value to set
 * @returns {boolean}
 */
export function setValue(target, value) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.value = String(value ?? '');
    return true;
  } catch (error) {
    logger.warn('Failed to set value', { error });
    return false;
  }
}

/**
 * Clear form input
 * @param {string|Element} target - Input selector or element
 * @returns {boolean}
 */
export function clearValue(target) {
  return setValue(target, '');
}

/**
 * Focus element
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function focus(target) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.focus();
    return true;
  } catch (error) {
    logger.warn('Failed to focus element', { error });
    return false;
  }
}

/**
 * Enable form element
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function enable(target) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.disabled = false;
    return true;
  } catch (error) {
    logger.warn('Failed to enable element', { error });
    return false;
  }
}

/**
 * Disable form element
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function disable(target) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.disabled = true;
    return true;
  } catch (error) {
    logger.warn('Failed to disable element', { error });
    return false;
  }
}

// ============================================================================
// DOM MANIPULATION
// ============================================================================

/**
 * Create element with optional attributes and content
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes object
 * @param {string} content - Inner text content
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      element.className = value;
    } else if (key === 'data') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = String(dataValue);
      });
    } else {
      element.setAttribute(key, String(value));
    }
  });
  
  if (content) {
    element.textContent = content;
  }
  
  return element;
}

/**
 * Remove element from DOM
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function removeElement(target) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.remove();
    return true;
  } catch (error) {
    logger.warn('Failed to remove element', { error });
    return false;
  }
}

/**
 * Clear all children of element
 * @param {string|Element} target - Selector or element
 * @returns {boolean}
 */
export function clearChildren(target) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    return true;
  } catch (error) {
    logger.warn('Failed to clear children', { error });
    return false;
  }
}

/**
 * Append element or HTML string to target
 * @param {string|Element} target - Target selector or element
 * @param {string|Element} content - HTML string or element to append
 * @returns {boolean}
 */
export function append(target, content) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    if (typeof content === 'string') {
      element.insertAdjacentHTML('beforeend', content);
    } else if (content instanceof Element) {
      element.appendChild(content);
    }
    return true;
  } catch (error) {
    logger.warn('Failed to append content', { error });
    return false;
  }
}

/**
 * Prepend element or HTML string to target
 * @param {string|Element} target - Target selector or element
 * @param {string|Element} content - HTML string or element to prepend
 * @returns {boolean}
 */
export function prepend(target, content) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    if (typeof content === 'string') {
      element.insertAdjacentHTML('afterbegin', content);
    } else if (content instanceof Element) {
      element.insertBefore(content, element.firstChild);
    }
    return true;
  } catch (error) {
    logger.warn('Failed to prepend content', { error });
    return false;
  }
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Add event listener
 * @param {string|Element} target - Selector or element
 * @param {string} eventType - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - addEventListener options
 * @returns {Function} Function to remove listener
 */
export function on(target, eventType, handler, options = {}) {
  const element = getElement(target);
  if (!element) {
    logger.warn('Cannot attach event to null element', { eventType });
    return () => {};
  }
  
  try {
    element.addEventListener(eventType, handler, options);
    
    // Return unsubscribe function
    return () => {
      element.removeEventListener(eventType, handler, options);
    };
  } catch (error) {
    logger.warn('Failed to attach event listener', { eventType, error });
    return () => {};
  }
}

/**
 * Remove event listener
 * @param {string|Element} target - Selector or element
 * @param {string} eventType - Event name
 * @param {Function} handler - Event handler
 * @returns {boolean}
 */
export function off(target, eventType, handler) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    element.removeEventListener(eventType, handler);
    return true;
  } catch (error) {
    logger.warn('Failed to remove event listener', { eventType, error });
    return false;
  }
}

/**
 * Trigger synthetic event on element
 * @param {string|Element} target - Selector or element
 * @param {string} eventType - Event name
 * @param {Object} detail - Event detail data
 * @returns {boolean}
 */
export function trigger(target, eventType, detail = null) {
  const element = getElement(target);
  if (!element) return false;
  
  try {
    const event = new CustomEvent(eventType, { detail, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return true;
  } catch (error) {
    logger.warn('Failed to trigger event', { eventType, error });
    return false;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get element from selector or return as-is if already an Element
 * @private
 * @param {string|Element} target - CSS selector or element
 * @returns {Element|null}
 */
function getElement(target) {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (typeof target === 'string') return query(target);
  return null;
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<Element|null>}
 */
export async function waitForElement(selector, timeout = 5000) {
  const element = query(selector);
  if (element) return element;
  
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = query(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

export default {
  // Querying
  query,
  queryAll,
  byId,
  closest,
  
  // Text & Content
  setText,
  getText,
  setHTML,
  getHTML,
  appendText,
  
  // Attributes
  getAttribute,
  setAttribute,
  removeAttribute,
  setData,
  getData,
  
  // Classes
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  
  // Styles
  setStyles,
  setStyle,
  getStyle,
  
  // Visibility
  show,
  hide,
  setVisible,
  isVisible,
  
  // Forms
  getValue,
  setValue,
  clearValue,
  focus,
  enable,
  disable,
  
  // DOM Manipulation
  createElement,
  removeElement,
  clearChildren,
  append,
  prepend,
  
  // Events
  on,
  off,
  trigger,
  waitForElement,
};
