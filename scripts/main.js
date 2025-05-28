import './lib/globals.js';
import './screens.js';

import { Game } from './game/game.js';
import { screens } from './screens.js';

/** @type {null | Game} */
let game = null;

selector('#newgame').addEventListener('click', () => {
    if (game) game.stopTick();
    game = new Game();
    game.startTick();
    screens.setActive(screens.game);
});

selector('#back').addEventListener('click', () => {
    screens.setActive(screens.title);
});

window.addEventListener('mousemove', e => {
    if (game) game.handleMousemove(e);
});

window.addEventListener('mousedown', e => {
    if (game) game.handleMousedown(e);
});

window.addEventListener('mouseup', e => {
    if (game) game.handleMouseup(e);
});

window.addEventListener('keydown', e => {
    if (game) game.handleKeydown(e);
});

window.addEventListener('keyup', e => {
    if (game) game.handleKeyup(e);
});
