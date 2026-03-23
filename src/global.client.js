/* eslint-disable n/no-unsupported-features/node-builtins -- Browser-only client bundle */
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
