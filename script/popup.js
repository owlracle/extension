import gasTimer from './gas.min.js';
import chart from './chart.min.js';
import api from './api.min.js';
import advisor from './advisor.min.js';
import { login, menu, Dropdown, network, messageBus } from './utils.min.js';

document.addEventListener('DOMContentLoaded', async () => {
    menu.init();
    gasTimer.init();
    chart.init();
    advisor.init();

    const networkSwitcher = {
        element: document.querySelector('#network-btn'),
        bound: false,
    
        reload: function() {
            if (!this.bound){
                this.bound = true;
                this.bindClick();
                this.element.classList.remove('hidden');
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

    // function for gas menu button
    menu.setClick('gas', () => networkSwitcher.reload());
    menu.setClick('chart', () => networkSwitcher.reload());
    menu.setClick('key', () => api.check());

    // check if user is logged with an api key

    // refresh cookies
    if (login.get('apikey')){
        login.refresh();
    }

    let menuOpt = null;
    if (!login.get('logged')){
        menuOpt = 'key';
    }
    
    menu.click(menuOpt);

    messageBus.watch();

    // listen to network switching
    messageBus.addEvent('network', message => {
        // console.log(message);
        if (!message.message.network) {
            document.querySelector('#content #advisor #network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
            advisor.network = false;
            advisor.setCost();
            return false;
        }

        const ntw = network.get(message.message.network);
        document.querySelector('#content #advisor #network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
        advisor.network = ntw;
        advisor.setCost();
        return true;
    });
});
