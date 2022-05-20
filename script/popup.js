import gasTimer from './gas.min.js';
import chart from './chart.min.js';
import api from './api.min.js';
import { login, menu, Dropdown, network, advisor } from './utils.min.js';

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

});

const advisorDOM = {
    init: async function() {
        const adv = await advisor.get();
        const container = document.querySelector('#content #advisor');
        container.innerHTML = `<div id="content" class="logged">
            <h2>Tx advisor</h2>
            <label><input id="allow" type="checkbox" class="checkbox" ${ adv.enabled ? 'checked' : '' }>Allow me to suggest the best gas price to your Metamask transaction</label>
        </div>`;

        container.querySelector('#allow').addEventListener('change', function() {
            advisor.set({ enabled: this.checked });
        })
    }
}