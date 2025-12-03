import { initRouter } from './router.js';
import { initAuth } from './auth.js';
import './pong.js';
import './tictactoe.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initAuth();
});