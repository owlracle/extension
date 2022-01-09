// set the cookie utils object
const cookies = {
    set: function (key, value, { expires, path, json } = {}) {
        if (!expires) {
            expires = 86400000;
        }
        if (!path) {
            path = '/';
        }
        if (json){
            value = JSON.stringify(value);
        }

        let expTime = 0;
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

        const cookieString = `${key}=${value};expires=${new Date(expTime).toUTCString()};path=${path}`;
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
            const optArgs = { expires: 86400000, path: '/' };

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


// set the corresponding network in header
const network = {
    list: {
        eth: {
            symbol: 'eth', name: 'Ethereum', token: 'ETH', explorer: {
                icon: 'https://etherscan.io/images/favicon3.ico', href: 'https://etherscan.io', name: 'Etherscan', apiAvailable: true,
            }
        },
        avax: {
            symbol: 'avax', name: 'Avalanche', token: 'AVAX', explorer: {
                icon: 'https://snowtrace.io/images/favicon.ico', href: 'https://snowtrace.io', name: 'SnowTrace', apiAvailable: true,
            }
        },
        poly: {
            symbol: 'poly', name: 'Polygon', token: 'MATIC', explorer: {
                icon: 'https://polygonscan.com/images/favicon.ico', href: 'https://polygonscan.com', name: 'PolygonScan', apiAvailable: true,
            }
        },
        ftm: {
            symbol: 'ftm', name: 'Fantom', token: 'FTM', explorer: {
                icon: 'https://ftmscan.com/images/favicon.png', href: 'https://ftmscan.com', name: 'FtmScan', apiAvailable: true,
            }
        },
        bsc: {
            symbol: 'bsc', name: 'BSC', longName: 'Binance Smart Chain', token: 'BNB', explorer: {
                icon: 'https://bscscan.com/images/favicon.ico', href: 'https://bscscan.com', name: 'BscScan', apiAvailable: true,
            }
        },
        movr: {
            symbol: 'movr', name: 'Moonriver', token: 'MOVR', explorer: {
                icon: 'https://moonriver.moonscan.io/images/favicon.ico', href: 'https://moonriver.moonscan.io/', name: 'MoonScan', apiAvailable: true,
            }
        },
        cro: {
            symbol: 'cro', name: 'Cronos', token: 'CRO', explorer: {
                icon: 'https://cronos.crypto.org/explorer/images/favicon-32x32-1d2f176ba4e0bc1155947d52652a35c8.png', href: 'https://cronos.crypto.org/explorer/', name: 'Cronos Explorer', apiAvailable: false,
            }
        },
    },

    get: function (name) {
        if (!name) {
            name = cookies.get('network') || 'bsc';
        }

        return this.list[name];
    },

    set: function (name) {
        cookies.set('network', name, { expires: { days: 365 } });
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
    constructor({ title, message, className }) {
        const fog = document.createElement('div');
        fog.id = 'fog';

        if (className) {
            fog.classList.add(className);
        }

        fog.innerHTML = `<div class="modal">
                <h2>${title}</h2>
                <div id="content">${message}</div>
                <div id="button-container">
                    <button id="ok">OK</button>
                </div>
            </div>`;
        document.body.appendChild(fog);
        fog.addEventListener('click', () => fog.remove());
        fog.querySelector('.modal').addEventListener('click', e => e.stopPropagation());
        fog.querySelector('#ok').addEventListener('click', () => fog.remove());

        return this;
    }
}


export { cookies, network, imgCache, ModalWindow, Dropdown };