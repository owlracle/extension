import advisor from './advisor.js';
import network from './helpers/network.js';
import storage from './helpers/storage.js';

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


// dropdown class
class Dropdown {
    constructor({ button, itemList, position, clickFn }) {
        button.addEventListener('click', function () {
            const dropdown = document.createElement('div');
            dropdown.id = 'dropdown';

            itemList.forEach(e => {
                const item = document.createElement('div');
                item.classList.add('item');

                item.innerHTML = e.innerHTML;

                Object.entries(e).forEach(([k, v]) => {
                    if (k != 'innerHTML') {
                        item.setAttribute(k, v);
                    }
                });
                dropdown.appendChild(item);
            });

            if (!position) {
                position = { top: 0, left: 0 };
            }
            dropdown.style.top = `${this.offsetTop + this.clientHeight + position.top}px`;
            dropdown.style.left = `${this.offsetLeft + position.left}px`;

            const fog = document.createElement('div');
            fog.id = 'fog';
            fog.classList.add('invisible');

            document.body.appendChild(fog);
            fog.appendChild(dropdown);

            fog.addEventListener('click', () => fog.remove());

            const items = dropdown.querySelectorAll('.item');
            items.forEach(b => b.addEventListener('click', () => clickFn(b)));

            return this;
        });
    }
}


// modal window
class ModalWindow {
    constructor({ title, message, className, buttons }) {
        const fog = document.createElement('div');
        fog.id = 'fog';

        if (className) {
            fog.classList.add(className);
        }

        if (!buttons){
            buttons = { 'OK': () => {}};
        }

        fog.innerHTML = `<div class="modal">
                <h2>${title}</h2>
                <div id="content">${message}</div>
                <div id="button-container">
                    ${Object.keys(buttons).map(b => `<button>${b}</button>`).join('')}
                </div>
            </div>`;
        document.body.appendChild(fog);
        fog.addEventListener('click', () => fog.remove());
        fog.querySelector('.modal').addEventListener('click', e => e.stopPropagation());
        
        fog.querySelectorAll('#button-container button').forEach((b,i) => {
            b.addEventListener('click', () => {
                Object.values(buttons)[i](fog);
                fog.remove();
            });
        });

        return this;
    }
}


// footer menu
const menu = {
    active: 'gas',

    // set function for switching between menu buttons
    init: async function() {
        document.querySelectorAll('#menu .item').forEach(e => e.addEventListener('click', () => this.setActive(e.id)));

        // try to load menu cookie
        const menuCk = await storage.get('menu');
        if (menuCk){
            try {
                this.active = menuCk;
            }
            catch (error){
                console.log(error);
                storage.delete('menu');
            }
        }
    },

    // change dom css
    setActive: function(active) {
        if (this.isDisabled(active)){
            return;
        }

        this.active = active;

        document.querySelectorAll('#menu .item, #content .item').forEach(e => {
            e.classList.remove('active');
        });

        document.querySelector(`#content #${active}.item`).classList.add('active');
        document.querySelector(`#menu #${active}.item`).classList.add('active');

        // set cookie
        storage.set('menu', this.active);
    },

    getActive: function() {
        return this.active;
    },

    setClick: function(active, fn) {
        document.querySelector(`#menu #${active}.item`).addEventListener('click', () => {
            if (!this.isDisabled(active)){
                fn();
            }
        });
    },

    click: function(active) {
        document.querySelector(`#menu #${active || this.active}.item`).click();
    },

    hide: function() {
        document.querySelectorAll('#header, #menu').forEach(e => e.classList.add('hidden'));
        return this;
    },
    
    show: function() {
        document.querySelectorAll('#header, #menu').forEach(e => e.classList.remove('hidden'));
        return this;
    },

    disable: function(active) {
        document.querySelector(`#menu #${active}.item`).classList.add('disabled');
    },

    isDisabled: function(active) {
        return document.querySelector(`#menu #${active}.item`).classList.contains('disabled');
    },

    enable: function(active) {
        document.querySelector(`#menu #${active}.item`).classList.remove('disabled');
    },
}


const messageBus = {
    events: {},

    // watch from message from contentScript
    watch: async function() {
        chrome.runtime.onMessage.addListener((message, sender, reply) => {
            // console.log(sender)
            
            let replyMsg = 'Message received';
            if (this.events[message.event]) {
                replyMsg = this.events[message.event](message);
            }

            if (reply){
                reply(replyMsg);
            }
        });
    },

    // add event listener: function to be called when messages are received
    addEvent: function(name, callback) {
        this.events[name] = callback;
    },

    // send to contentScript
    send: function(event, message, reply, background=false) {
        // console.log(event, message)
        if (background) {
            chrome.runtime.sendMessage({ event: event, message: message }, response => {
                if (reply) {
                    reply(response);
                }
            });
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { event: event, message: message }, response => {
                // console.log(response)
                if (reply) {
                    reply(response);
                }
            });
        });
    },
}


export { login, imgCache, ModalWindow, Dropdown, menu, messageBus, serverURL };