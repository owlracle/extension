import Request from './helpers/request.js';
import { login, messageBus, serverURL } from './utils.js';
import network from './helpers/network.js';
import storage from './helpers/storage.js';
import storage from './helpers/storage.js';
import ModalWindow from './components/modal.js';

// advisor config and methods
const advisor = {
    speed: '75',
    fee: 0.1,
    maxFee: 0.1,

    set: async function(data) {
        const properties = await this.get();
        Object.entries(data).forEach(([k,v]) => properties[k] = v);
        await storage.set('advisor', properties);
        messageBus.send('advisor', properties);
    },

    // return the storage var, or wait until it is ready
    get: async function() {
        const storage = await storage.get('advisor');
        return storage || await new Promise(resolve => setTimeout(async () => resolve(await this.get()), 100));
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
            <a href="https://discord.gg/yj4n3pk9Nq" target="_blank">Found a bug? Please report.</a>
        </div>`;

        container.querySelectorAll('input.range').forEach(e => createInputRange(e));

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
        messageBus.send('get-network', {} , async message => {
            // console.log(message)
            if (!message) {
                container.querySelector('#network-container #network').innerHTML = `<b class="red">Unsupported network</b>`;
                this.network = false;
                this.setCost();
                return false;
            }

            const ntw = await network.get(message);
            if (!ntw) {
                return false;
            }

            container.querySelector('#network-container #network').innerHTML = `<img src="https://owlracle.info/img/${ ntw.symbol }.png"><span>${ ntw.name }</span>`;
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
        const data = await new Request({ url: serverURL }).get(`${ this.network.symbol }/gas`, query);

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

function createInputRange(elem) {
    const size = Array.from(document.querySelectorAll('.range-custom')).length;
    elem.id = `input-range-${size}`;
    elem.insertAdjacentHTML('afterend', `
        <div id="range-custom-${size}" class="range-custom">
            <div class="bar">
                <div class="filled"></div>
                <div class="thumb"></div>
            </div>
        </div>
    `);
    elem.setAttribute('hidden', true);

    const speedContainer = document.querySelector('#content #advisor #speed-container')
    const range = document.querySelector(`#range-custom-${size}`);
    const thumb = range.querySelector(`.thumb`);
    const filled = range.querySelector(`.filled`);

    const moveRange = (e, ignoreButton) => {
        if (speedContainer.classList.contains('disabled')) {
            return;
        }

        // enter when clicking or dragging
        if (e && e.buttons === 1 || ignoreButton) {
            const pos = e.offsetX / range.offsetWidth;
            elem.value = (parseInt(elem.max) - parseInt(elem.min)) * pos + parseInt(elem.min);
        }

        // enter normally, or at the start (!e)
        if (!e || (e.buttons === 1 || ignoreButton)) {
            thumb.innerHTML = elem.value;
            // recalc after setting value, because input step
            const newPos = (elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 100;
            filled.style['width'] = `${ newPos }%`;
    
            const r = 200 - ((elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 97);
            const g = (elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 71 + 90;
            filled.style['background-color'] = `rgb(${r},${g},64)`;
        }
    };
    moveRange();
    range.addEventListener('mousemove', e => moveRange(e));
    range.addEventListener('click', e => moveRange(e, true));

    // set speed when done dragging
    range.addEventListener('mouseup', () => {
        if (speedContainer.classList.contains('disabled')) {
            return;
        }

        // wait a little time for elem.value update
        setTimeout(() => {
            advisor.speed = elem.value;
            advisor.set({ speed: elem.value });
            advisor.setCost();
        }, 100);
    });
}

export default advisor;