import gasTimer from './gas.min.js';
import chart from './chart.min.js';
import api from './api.min.js';
import { login, menu, Dropdown, network, advisor, messageBus } from './utils.min.js';

document.addEventListener('DOMContentLoaded', async () => {
    menu.init();
    gasTimer.init();
    chart.init();
    advisorDOM.init();

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
        if (!message.message.network) {
            document.querySelector('#content #advisor #network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
            advisorDOM.network = false;
            return false;
        }

        const ntw = network.get(message.message.network);
        document.querySelector('#content #advisor #network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
        advisorDOM.network = ntw;
        return true;
    });
});

const advisorDOM = {
    init: async function() {
        const adv = await advisor.get();
        const container = document.querySelector('#content #advisor');
        container.innerHTML = `<div id="content" class="logged">
            <h2>Tx advisor</h2>
            <div id="metamask-connected">
                <img src="img/metamask-fox.svg" id="metamask-icon">
                <div id="network-container">
                    <span>Metamask connected to</span>
                    <div id="network"></div>
                </div>
            </div>
            <div id="enable-container">
                <label><input id="allow" type="checkbox" class="checkbox" ${ adv.enabled ? 'checked' : '' }>Allow me to suggest the best gas price to your Metamask transaction</label>
                <div id="cost-card">
                    <span class="title">🦊 advice cost</span>
                    <div class="card">Not receiving advices</div>
                </div>
            </div>
        </div>`;

        container.querySelector('#allow').addEventListener('change', function() {
            advisor.set({ enabled: this.checked });
        });

        // request network to inject (when popup open)
        messageBus.send('get-network', {} , message => {
            if (!message) {
                container.querySelector('#network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
                this.network = false;
                return false;
            }

            const ntw = network.get(message);
            container.querySelector('#network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
            this.network = ntw;
            return true;
        });

    }
}