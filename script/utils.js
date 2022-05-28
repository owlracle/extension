import advisor from './advisor.min.js';

const serverURL = "https://owlracle.info";
// const serverURL = "ngrok dev url";

// set the cookie utils object
const cookies = {
    set: function (key, value, { expires, path, json } = {}) {
        let expTime = 0;
        if (expires) {
            if (typeof expires === "object") {
                expTime += (expires.seconds * 1000) || 0;
                expTime += (expires.minutes * 1000 * 60) || 0;
                expTime += (expires.hours * 1000 * 60 * 60) || 0;
                expTime += (expires.days * 1000 * 60 * 60 * 24) || 0;
            }
            else {
                expTime = expires;
            }

            const now = new Date();
            expTime = now.setTime(now.getTime() + expTime);    
        }
        if (!path) {
            path = '/';
        }
        if (json){
            value = JSON.stringify(value);
        }

        expTime = expTime > 0 ? `;expires=${new Date(expTime).toUTCString()}` : '';
        const cookieString = `${key}=${value}${expTime};path=${path}`;
        document.cookie = cookieString;
        return cookieString;
    },

    get: function (key, json) {
        const cookies = document.cookie.split(';').map(e => e.trim());
        const match = cookies.filter(e => e.split('=')[0] == key);
        let value = match.length ? match[0].split('=')[1] : false;

        if (value && json){
            value = JSON.parse(value);
        }

        return value;
    },

    delete: function (key) {
        const cookies = document.cookie.split(';').map(e => e.trim());
        const match = cookies.filter(e => e.split('=')[0] == key);

        document.cookie = `${key}=0;expires=${new Date().toUTCString()}`;
        return match.length > 0;
    },

    refresh: function (key, { expires, path } = {}) {
        if (this.get(key)){
            const optArgs = { path: '/' };

            if (expires) {
                optArgs.expires = expires;
            }
            if (path) {
                optArgs.path = path;
            }

            return this.set(key, this.get(key), optArgs);
        }
        return false;
    },
};


const login = {
    set: function(args) {
        const login = cookies.get('login', true) || {};

        Object.entries(args).forEach(([k,v]) => login[k] = v);

        const opt = { json: true };
        if (login.persist){
            opt.expires = { days: 365 };
        }
        cookies.set('login', login, opt);

        if (login.apikey) {
            advisor.set({ apiKey: login.apikey });
        }
    },

    refresh: function() {
        this.set({});
    },

    get: function(field){
        const login = cookies.get('login', true);

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

    delete: function(fields){
        if (!Array.isArray(fields)){
            fields = [fields];
        }

        const login = cookies.get('login', true);

        fields.forEach(f => {
            if (login && login[f]){
                delete login[f];
            }
        });

        const opt = { json: true };
        if (login.persist){
            opt.expires = { days: 365 };
        }
        cookies.set('login', login, opt);

        if (fields.includes('apikey')) {
            advisor.set({ apiKey: false });
        }
    }
}


// set the corresponding network in header
const network = {
    list: {
        eth: { symbol: 'eth', name: 'Ethereum', token: 'ETH', explorer: {
            icon: 'https://etherscan.io/images/favicon3.ico', href: 'https://etherscan.io', name: 'Etherscan', apiAvailable: true,
        } },
        bsc: { symbol: 'bsc', name: 'BSC', longName: 'Binance Smart Chain', token: 'BNB', explorer: {
            icon: 'https://bscscan.com/images/favicon.ico', href: 'https://bscscan.com', name: 'BscScan', apiAvailable: true,
        } },
        poly: { symbol: 'poly', name: 'Polygon', token: 'MATIC', explorer: {
            icon: 'https://polygonscan.com/images/favicon.ico', href: 'https://polygonscan.com', name: 'PolygonScan', apiAvailable: true,
        } },
        ftm: { symbol: 'ftm', name: 'Fantom', token: 'FTM', explorer: {
            icon: 'https://ftmscan.com/images/favicon.png', href: 'https://ftmscan.com', name: 'FtmScan', apiAvailable: true,
        } },
        avax: { symbol: 'avax', name: 'Avalanche', token: 'AVAX', explorer: {
            icon: 'https://snowtrace.io/images/favicon.ico', href: 'https://snowtrace.io', name: 'SnowTrace', apiAvailable: true,
        } },
        cro: { symbol: 'cro', name: 'Cronos', token: 'CRO', explorer: {
            icon: 'https://cronoscan.com/images/favicon.ico', href: 'https://cronoscan.com/', name: 'Cronoscan', apiAvailable: true,
        } },
        movr: { symbol: 'movr', name: 'Moonriver', token: 'MOVR', explorer: {
            icon: 'https://moonriver.moonscan.io/images/favicon.ico', href: 'https://moonriver.moonscan.io/', name: 'MoonScan', apiAvailable: true,
        } },
        one: { symbol: 'one', name: 'Harmony', token: 'ONE', explorer: {
            icon: 'https://explorer.harmony.one/favicon.ico', href: 'https://explorer.harmony.one', name: 'Harmony Explorer', apiAvailable: false,
        } },
        ht: { symbol: 'ht', name: 'Heco', token: 'HT', explorer: {
            icon: 'https://hecoinfo.com/favicon.ico', href: 'https://hecoinfo.com', name: 'HecoInfo', apiAvailable: false,
        } },
        celo: { symbol: 'celo', name: 'Celo', token: 'CELO', explorer: {
            icon: 'https://avatars.githubusercontent.com/u/37552875?s=200&v=4', href: 'https://explorer.celo.org', name: 'Celo Explorer', apiAvailable: false,
        } },
        fuse: { symbol: 'fuse', name: 'Fuse', token: 'FUSE', explorer: {
            icon: 'https://explorer.fuse.io/images/favicon-543fd97558f89019d8ee94144a7e46c7.ico?vsn=d', href: 'https://explorer.fuse.io/', name: 'Fuse Explorer', apiAvailable: false,
        } },
    },

    get: function (name) {
        if (!name) {
            name = cookies.get('network') || 'eth';
        }

        return this.list[name];
    },

    set: function (name) {
        cookies.set('network', name);
    },

    getList: function () {
        return this.list;
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
    init: function() {
        document.querySelectorAll('#menu .item').forEach(e => e.addEventListener('click', () => this.setActive(e.id)));

        // try to load menu cookie
        if (cookies.get('menu')){
            try {
                this.active = cookies.get('menu');
            }
            catch (error){
                console.log(error);
                cookies.delete('menu');
            }
        }
    },

    // change dom css
    setActive: function(active) {
        this.active = active;

        document.querySelectorAll('#menu .item, #content .item').forEach(e => {
            e.classList.remove('active');
        });

        document.querySelector(`#content #${active}.item`).classList.add('active');
        document.querySelector(`#menu #${active}.item`).classList.add('active');

        // set cookie
        cookies.set('menu', this.active);
    },

    getActive: function() {
        return this.active;
    },

    setClick: function(active, fn) {
        document.querySelector(`#menu #${active}.item`).addEventListener('click', () => fn());
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


export { cookies, login, network, imgCache, ModalWindow, Dropdown, menu, messageBus, serverURL };