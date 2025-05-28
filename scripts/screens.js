export const screens = {
    title: selector('#title-screen'),
    gameover: selector('#gameover-screen'),
    game: selector('#game-screen'),
    active: selector('.active.screen'),

    /** @param {Element} screen */
    setActive(screen) {
        this.active.classList.remove('active');
        screen.classList.add('active');
        this.active = screen;
    },
};
