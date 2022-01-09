import chart from './chart.js';
import gasTimer from './gas.js';
import { network, cookies, Dropdown } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // check if user is logged with an api key
    if (!cookies.get('apikey')){
        cookies.set('apikey', '',);
        // new ModalWindow({
        //     title: `Welcome to Owlracle!`,
        //     message: `<p>Owlracle is a multichain gas price tracker. With Owlracle You can know the best gas price setting across seven chains with just a glance.</p><p>To better enjoy Owlracle it is reccomended that you use an api key. You can create one for free.</p>`,
        // });
    }

    const networkSwitcher = {
        element: document.querySelector('#network-btn'),
        bound: false,

        reload: function() {
            if (!this.bound){
                this.bound = true;
                this.bindClick();
                gasTimer.init();
                chart.init();
            }

            document.querySelector('#header #link').href = `https://owlracle.info/${network.get().symbol}`;

            this.element.removeAttribute('class');
            this.element.classList.add(network.get().symbol);
            this.element.querySelector('img').src = `https://owlracle.info/img/${network.get().symbol}.png`;
            this.element.querySelector('span').innerHTML = network.get().name;

            if (menu.getActive() == 'gas'){
                gasTimer.update();
            }
            if (menu.getActive() == 'chart'){
                chart.timeframeSwitch();
            }
        },

        get: function() {
            return this.element;
        },

        bindClick: function() {
            // network button action
            new Dropdown({
                button: this.element,
                itemList: Object.values(network.getList()).map(e => { return { id: e.symbol, innerHTML: `<img class="icon" src="${e.icon.src}" alt="${e.name} icon"><span class="name">${e.name}</span>` }}),
                clickFn: e => {
                    network.set(e.id);
                    this.reload();
                },
            });
        }
    };


    const menu = {
        active: 'gas',

        // set function for switching between menu buttons
        init: function() {
            document.querySelectorAll('#menu .item').forEach(e => e.addEventListener('click', () => this.setActive(e.id)));

            // try to load menu cookie
            if (cookies.get('menu')){
                try {
                    this.active = JSON.parse(cookies.get('menu'));
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
            cookies.set('menu', JSON.stringify(this.active), { expires: { days: 365 } });
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
    }
    menu.init();

    // function for gas menu button
    menu.setClick('gas', () => networkSwitcher.reload());
    menu.setClick('chart', () => networkSwitcher.reload());
    menu.click();
});