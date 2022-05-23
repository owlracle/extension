import gasTimer from './gas.min.js';
import chart from './chart.min.js';
import api from './api.min.js';
import { login, menu, Dropdown, network, advisor, messageBus, ModalWindow } from './utils.min.js';

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
        // console.log(message);
        if (!message.message.network) {
            document.querySelector('#content #advisor #network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
            advisor.network = false;
            advisorDOM.setCost();
            return false;
        }

        const ntw = network.get(message.message.network);
        document.querySelector('#content #advisor #network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
        advisor.network = ntw;
        advisorDOM.setCost();
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
                <label><input id="allow" type="checkbox" class="checkbox" ${ adv.enabled ? 'checked' : '' }>Allow me to submit gas price suggestions into your Metamask transaction</label>
                <div id="cost-card">
                    <div class="title"><span>Advice cost<i id="cost-help" class="fa-regular fa-circle-question"></i></span></div>
                    <div class="body">
                        <span class="value"></span>
                        <span class="info">/ submitted tx</span>
                    </div>
                </div>
            </div>
        </div>`;

        // click the allow button to to start receiving advices
        container.querySelector('#allow').addEventListener('change', function() {
            advisor.set({ enabled: this.checked }).then(() => {
                advisorDOM.setCost();
            });
        });

        // help about the costs
        container.querySelector('#cost-help').addEventListener('click', () => {
            new ModalWindow({
                title: 'Advisor costs help',
                message: `
                    <p>This action will deduct credit from your API account. But since our advice is awesome 🦉, it will always be worth it.</p>

                    <span>Cost:</span>
                    <ul>
                        <li><b>${ (this.fee * 100).toFixed(0) }%</b> of the predicted network fee.</li>
                        <li>Maximum value: <b><code>$${ this.maxFee }</code></b></li>
                    </ul>

                    <p>In most cases, the advisor saves you more than it costs. On the rare occasions it doesn't, it will prevent your transaction from being stuck in a congested network.</p>
                `,
            });
        });

        // request network to inject (when popup open)
        messageBus.send('get-network', {} , message => {
            if (!message) {
                container.querySelector('#network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
                advisor.network = false;
                this.setCost();
                return false;
            }

            const ntw = network.get(message);
            container.querySelector('#network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ntw.symbol}.png"><span>${ntw.name}</span>`;
            advisor.network = ntw;
            this.setCost();
            return true;
        });

    },

    setCost: async function() {
        const container = document.querySelector('#content #advisor');
        const card = container.querySelector('#cost-card');
        const valueBox = card.querySelector('.value');

        card.classList.remove('disabled');

        const advisorEnabled = (await advisor.get('enabled')).enabled;
        if (!advisor.network || !advisorEnabled) {
            card.classList.add('disabled');
            valueBox.innerHTML = 'N/A';

            return;
        }

        const query = {
            source: 'extension',
            apikey: login.get().apikey,
            accept: advisor.speed,
        };
        const data = await (await fetch(`https://owlracle.info/${ advisor.network.symbol }/gas?${ new URLSearchParams(query).toString() }`)).json();
        // console.log(data);    
    
        const value = (Math.min(advisor.maxFee, data.speeds[0].estimatedFee * advisor.fee)).toFixed(4);
        valueBox.innerHTML = `$${value}`;
    }
}