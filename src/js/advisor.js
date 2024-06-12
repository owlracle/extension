import Request from './helpers/request.js';
import Network from './helpers/network.js';
import storage from './helpers/storage.js';
import ModalWindow from './components/modal.js';
import Message from './helpers/message.js';
import login from './helpers/login.js';
import InputRange from './components/inputRange.js';

// advisor config and methods
const advisor = {
    speed: '75',
    fee: 0.1,
    maxFee: 0.1,
    website: 'https://owlracle.info',

    set: async function(data) {
        const properties = await this.get();
        Object.entries(data).forEach(([k,v]) => properties[k] = v);
        await storage.set('advisor', properties);
        new Message('advisor').send(properties);
    },

    // return the storage var, or wait until it is ready
    get: async function() {
        const storageData = await storage.get('advisor');
        return storageData || await new Promise(resolve => setTimeout(async () => resolve(await this.get()), 100));
    },

    init: async function() {
        const container = document.querySelector('#content #advisor');

        if (!(await login.get('apikey'))) {
            container.innerHTML = `<div id="content" class="logged">
                <h2>Tx advisor <span class="beta">beta</span></h2>
                <p>You need to login to be able to use this feature</p>
            `;
            return;
        }

        const adv = await this.get();
        if (adv.speed) {
            this.speed = adv.speed;
        }

        container.innerHTML = `<div id="content" class="logged">
            <h2>Tx advisor <span class="beta">beta</span></h2>
            <div id="metamask-connected">
                <img src="img/metamask-fox.svg" id="metamask-icon">
                <div id="network-container">
                    <span>Metamask connected to</span>
                    <div id="network"></div>
                </div>
            </div>
            <div id="enable-container">
                <div>
                    <label><input id="allow" type="checkbox" class="checkbox" ${ adv.enabled ? 'checked' : '' }>Allow gas price suggestions into your Metamask transaction</label>
                    <label class="require-allow"><input id="notifications" type="checkbox" class="checkbox" ${ adv.notifications ? 'checked' : '' }>Receive browser notifications</label>
                </div>
                <div id="cost-card" class="require-allow">
                    <div class="title"><span>Advice cost<i id="cost-help" class="fa-regular fa-circle-question"></i></span></div>
                    <div class="body">
                        <span class="value"></span>
                        <span class="info">/ tx submitted</span>
                    </div>
                </div>
            </div>
            <h3 class="require-allow">Transaction acceptance (speed)<i id="accept-help" class="fa-regular fa-circle-question"></i></h3>
            <div id="speed-container" class="require-allow">
                <div id="label-container">
                    <span>Slow</span>
                    <span>Standard</span>
                    <span>Fast</span>
                    <span>Instant</span>
                </div>
                <input type="range" min="35" max="100" step="5" value="${ this.speed }" class="range">
            </div>
            <a href="${this.website}/discord-support" target="_blank">Found a bug? Please report.</a>
        </div>`;

        container.querySelectorAll('input.range').forEach(e => {
            const input = new InputRange(e);
            input.change(value => {
                advisor.speed = value;
                advisor.set({ speed: value });
                advisor.setCost();
            })
        });

        // click the allow button to to start receiving advices
        const allowCheck = container.querySelector('label #allow');
        allowCheck.addEventListener('change', () => {
            this.set({ enabled: allowCheck.checked }).then(() => {
                this.setCost();
            });
        });

        // enable/disable browser notifications
        const notifCheck = container.querySelector('label #notifications');
        notifCheck.addEventListener('change', () => {
            this.set({ notifications: notifCheck.checked });
        });

        // help about the costs
        container.querySelector('#cost-help').addEventListener('click', () => {
            new ModalWindow({
                title: 'Advisor costs',
                message: `
                    <p>This action will deduct credit from your API account. But since our advice is awesome 🦉, it will always be worth it.</p>

                    <span>Cost:</span>
                    <ul>
                        <li><b>${ (this.fee * 100).toFixed(0) }%</b> of the predicted network fee.</li>
                        <li>Maximum value: <b><code>$${ this.maxFee }</code></b></li>
                    </ul>

                    <p>In most cases, the advisor saves you more than it costs. On the rare occasions it doesn't, it will prevent your transaction from being stuck in a congested network.</p>

                    <p class="free">For a limited time, all advice requests are FREE!</p>
                `,
            });
        });

        // help about the accept
        container.querySelector('#accept-help').addEventListener('click', () => {
            new ModalWindow({
                title: 'Transaction acceptance',
                message: `
                    <p>Owlracle will suggest a gas price for you. The higher the price, the higher the chance for your transaction to be accepted on each block.</p>
                    <p>The speed slider tells Owlracle the desired percentage of blocks you wish your transaction to be accepted (on average).</p>
                    <p>So a higher percentage means your transaction will be accepted earlier but you pay a higher price.</p>
                `,
            });
        });

        // request network to inject (when popup open)
        new Message('get-network').send({} , async message => {
            // console.log('message received', message);
            if (!message) {
                container.querySelector('#network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
                this.network = false;
                this.setCost();
                return false;
            }

            const ntw = await new Network(message).get();
            if (!ntw) {
                return false;
            }

            container.querySelector('#network-container #network').innerHTML = `<img src="${this.website}/img/${ ntw.symbol }.png"><span>${ ntw.name }</span>`;
            this.network = ntw;
            this.setCost();
            return true;
        });
    },

    setCost: async function() {
        const container = document.querySelector('#content #advisor');
        const card = container.querySelector('#cost-card');
        const valueBox = card.querySelector('.value');

        container.querySelectorAll('.require-allow').forEach(e => e.classList.remove('disabled'));
        container.querySelector('label #notifications').removeAttribute('disabled');
        
        const advisorEnabled = (await this.get('enabled')).enabled;
        if (!this.network || !advisorEnabled) {
            container.querySelectorAll('.require-allow').forEach(e => e.classList.add('disabled'));
            container.querySelector('label #notifications').setAttribute('disabled', true);
            valueBox.innerHTML = 'N/A';

            return;
        }

        const query = {
            source: 'extension',
            queryadvisor: true,
            apikey: (await login.get()).apikey,
            accept: this.speed,
        };
        const data = await new Request().get(`${ this.network.symbol }/gas`, query);

        // console.log(data);
    
        if (!data.advice){
            valueBox.innerHTML = `N/A`;
            return;
        }

        if (data.advice.free) {
            valueBox.innerHTML = `<span class="free">FREE</span>`;
            return;
        }

        valueBox.innerHTML = `$${ parseFloat(data.advice.fee).toFixed(4) }`;
    }
};

export default advisor;