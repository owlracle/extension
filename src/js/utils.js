import advisor from './advisor.js';
import network from './helpers/network.js';
import storage from './helpers/storage.js';
import menu from './components/menu.js';

const serverURL = 'https://owlracle.info';

// preload images
const imgCache = (() => {
    Object.values(network.getList()).forEach(e => {
        e.icon = document.createElement('img');
        e.icon.src = `https://owlracle.info/img/${e.symbol}.png`;
    });

    return Object.fromEntries([
        ...['candle-chart', 'line-chart'].map(e => {
            const img = document.createElement('img');
            img.src = `https://owlracle.info/img/${e}.png`;
            return [e, img];
        }),
        ...['time-10', 'time-30', 'time-60', 'time-120', 'time-240', 'time-1440'].map(e => {
            const img = document.createElement('img');
            img.src = `img/${e}.png`;
            return [e, img];
        })
    ]);
})();


export { imgCache, serverURL };