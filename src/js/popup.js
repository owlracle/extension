import gasTimer from './gas.js';
import chart from './chart.js';
import api from './api.js';
import advisor from './advisor.js';
import login from './helpers/login.js';
import Network from './helpers/network.js';
import Dropdown from './components/dropdown.js';
import menu from './components/menu.js';
import Message from './helpers/message.js';

import "../less/popup.less";

const website = 'https://owlracle.info';

document.addEventListener('DOMContentLoaded', async () => {
    menu.init();
    gasTimer.init();
    chart.init();
    advisor.init();

    const networkSwitcher = {
        element: document.querySelector('#network-btn'),
        bound: false,
    
        reload: async function() {
            if (!this.bound){
                this.bound = true;
                this.bindClick();
                this.element.classList.remove('hidden');
            }
    
            const ntw = await new Network().get();
            document.querySelector('#header #link').href = `${website}/${ ntw.symbol }`;
    
            this.element.removeAttribute('class');
            this.element.classList.add(ntw.symbol);
            this.element.querySelector('img').src = `${website}/img/${ ntw.symbol }.png`;
            this.element.querySelector('span').innerHTML = ntw.name;
    
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
    
        bindClick: async function() {
            // network button action
            new Dropdown({
                button: this.element,
                itemList: Object.values(await Network.getList()).map(e => ({ id: e.symbol, innerHTML: `<img class="icon" src="${website}/img/${e.symbol}.png" alt="${e.name} icon"><span class="name">${e.name}</span>` })),
                clickFn: e => {
                    new Network().set(e.id);
                    this.reload();
                },
            });
        }
    };

    // function for gas menu button
    menu.setClick('gas', () => networkSwitcher.reload());
    menu.setClick('chart', () => networkSwitcher.reload());
    menu.setClick('advisor', () => advisor.init());
    menu.setClick('key', () => api.check());

    // check if user is logged with an api key

    // refresh cookies
    if (await login.get('apikey')){
        login.refresh();
    }
    else {
        menu.disable('advisor');
    }

    let menuOpt = null;
    if (!(await login.get('logged'))){
        menuOpt = 'key';
    }
    
    menu.click(menuOpt);

    // listen to network switching
    new Message('network').listen(async message => {
        // console.log(message);
        if (!message.network) {
            document.querySelector('#content #advisor #network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
            advisor.network = false;
            advisor.setCost();
            return false;
        }

        const ntw = await new Network(message.network).get();
        document.querySelector('#content #advisor #network-container #network').innerHTML = `<img src="${website}/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
        advisor.network = ntw;
        advisor.setCost();
        return true;
    });
});
