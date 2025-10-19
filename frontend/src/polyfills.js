// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

// Make global available
if (typeof global === 'undefined') {
  window.global = globalThis;
}
