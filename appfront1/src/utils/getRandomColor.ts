export const getRandomColor = () => {
    const colors = [
        '#ff00d9',
        '#40407a',
        '#706fd3',
        '#34ace0',
        '#33d9b2',
        '#2c2c54',
        '#0025FF',
        '#474787',
        '#aaa69d',
        '#227093',
        '#218c74',
        '#ff5252',
        '#ff793f',
        '#ffb142',
        '#ffda79',
        '#b33939',
        '#cd6133',
        '#84817a',
        '#cc8e35',
        '#ccae62',
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};
