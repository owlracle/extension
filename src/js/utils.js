import advisor from './advisor.js';
import network from './helpers/network.js';
import storage from './helpers/storage.js';
import menu from './components/menu.js';

const serverURL = 'https://owlracle.info';
// const serverURL = 'https://738e-179-152-6-27.ngrok.io';

// NOT USED ANYMORE, maybe will use in the future
// set the cookie utils object
// const cookies = {
//     set: function (key, value, { expires, path, json } = {}) {
//         let expTime = 0;
//         if (expires) {
//             if (typeof expires === "object") {
//                 expTime += (expires.seconds * 1000) || 0;
//                 expTime += (expires.minutes * 1000 * 60) || 0;
//                 expTime += (expires.hours * 1000 * 60 * 60) || 0;
//                 expTime += (expires.days * 1000 * 60 * 60 * 24) || 0;
//             }
//             else {
//                 expTime = expires;
//             }

//             const now = new Date();
//             expTime = now.setTime(now.getTime() + expTime);    
//         }
//         if (!path) {
//             path = '/';
//         }
//         if (json){
//             value = JSON.stringify(value);
//         }

//         expTime = expTime > 0 ? `;expires=${new Date(expTime).toUTCString()}` : '';
//         const cookieString = `${key}=${value}${expTime};path=${path}`;
//         document.cookie = cookieString;
//         return cookieString;
//     },

//     get: function (key, json) {
//         const cookies = document.cookie.split(';').map(e => e.trim());
//         const match = cookies.filter(e => e.split('=')[0] == key);
//         let value = match.length ? match[0].split('=')[1] : false;

//         if (value && json){
//             value = JSON.parse(value);
//         }

//         return value;
//     },

//     delete: function (key) {
//         const cookies = document.cookie.split(';').map(e => e.trim());
//         const match = cookies.filter(e => e.split('=')[0] == key);

//         document.cookie = `${key}=0;expires=${new Date().toUTCString()}`;
//         return match.length > 0;
//     },

//     refresh: function (key, { expires, path } = {}) {
//         if (this.get(key)){
//             const optArgs = { path: '/' };

//             if (expires) {
//                 optArgs.expires = expires;
//             }
//             if (path) {
//                 optArgs.path = path;
//             }

//             return this.set(key, this.get(key), optArgs);
//         }
//         return false;
//     },
// };


const login = {
    set: async function(args) {
        const login = (await storage.get('login')) || {};

        Object.entries(args).forEach(([k,v]) => login[k] = v);

        storage.set('login', login);

        if (login.apikey) {
            advisor.set({ apiKey: login.apikey });
            menu.enable('advisor');
        }
    },

    refresh: function() {
        this.set({});
    },

    get: async function(field){
        const login = await storage.get('login');

        if (!login){
            return false;
        }
        if (!field){
            return login;
        }
        if (!login[field]){
            return false;
        }
        return login[field];
    },

    delete: async function(fields){
        if (!Array.isArray(fields)){
            fields = [fields];
        }

        const login = await storage.get('login', true);

        fields.forEach(f => {
            if (login && login[f]){
                delete login[f];
            }
        });

        storage.set('login', login);

        if (fields.includes('apikey')) {
            advisor.set({ apiKey: false });
            menu.disable('advisor');
        }
    }
}


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


export { login, imgCache, serverURL };