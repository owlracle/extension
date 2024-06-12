import Request from './helpers/request.js';
import Network from './helpers/network.js';
import ModalWindow from './components/modal.js';
import menu from './components/menu.js';
import login from './helpers/login.js';
import Button from './components/button.js';
import ModalMenu from './components/modalMenu.js';
import storage from './helpers/storage.js';

const gasTimer = {
    speeds: [
        { name: '🛸 Instant', accept: 100 },
        { name: '🚀 Instant', accept: 95 },
        { name: '✈️ Fast', accept: 90 },
        { name: '🚅 Fast', accept: 85 },
        { name: '🏎️ Fast', accept: 80 },
        { name: '🚓 Fast', accept: 75 },
        { name: '🚗 Fast', accept: 70 },
        { name: '🏍️ Standard', accept: 65 },
        { name: '🛵 Standard', accept: 60 },
        { name: '🚂 Standard', accept: 55 },
        { name: '🚤 Standard', accept: 50 },
        { name: '⛵ Standard', accept: 45 },
        { name: '🚲 Slow', accept: 40 },
        { name: '🚜 Slow', accept: 35 },
        { name: '🛴 Slow', accept: 30 },
        { name: '🏃‍♂️ Slow', accept: 25 },
        { name: '🚶‍♂️ Slow', accept: 20 },
    ],

    cards: [100, 90, 60, 35],

    gasUsed: [
        { name: "Uniswap V3: Swap", gas: 184523 },
        { name: "Standard Transfer", gas: 21000 },
        { name: "ERC20: Transfer", gas: 65000 },
        { name: "Multichain: Bridge", gas: 57887 },
        { name: "OpenSea: Sale", gas: 71645 },
        { name: "Aave: Borrow", gas: 318788 },
        { name: "ENS: Register Domain", gas: 266996 },
    ],

    gasChosen: 0,

    init: function () {
        const container = document.querySelector('#content #gas');
        container.innerHTML = '';

        this.cards.forEach(card => {
            const dom = `<div class="gas">
                <div class="col">
                    <div class="name">${this.speeds.find(s => s.accept == card).name}</div>
                    <div class="usd"></div>
                </div>
                <div class="col">
                    <div class="gwei"></div>
                    <div class="base"></div>
                    <div class="tip"></div>
                </div>
            </div>`;
            container.insertAdjacentHTML('beforeend', dom);
        });

        this.beforeUpdate();

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        container.appendChild(buttonContainer);

        new Button('Customize Speeds').click(async () => {
            // new Dropdown();
        }).append(buttonContainer);

        new Button('Customize Fee').click(() => {
            new ModalMenu(
                this.gasUsed.map(gas => ({
                    text: gas.name,
                    action: () => {
                        this.gasChosen = gas.gas;
                        storage.set('gas-used', gas.gas);
                        this.update();
                    },
                    customClass: gas.gas == this.gasChosen ? 'active' : null,
                })),
                {customClass: 'gas-used'},
            );
        }).append(buttonContainer);

    },

    update: async function () {
        this.beforeUpdate();

        this.gasChosen = await storage.get('gas-used') || this.gasUsed[0].gas;

        let query = {
            accept: this.cards.join(','),
            source: 'extension',
            gasused: this.gasChosen,
        };

        const ak = await login.get('apikey');
        if (ak) {
            query.apikey = ak;
        }

        if (this.blocks) {
            query.blocks = this.blocks;
        }

        if (this.percentile) {
            query.percentile = this.percentile;
        }

        const data = await new Request().get(`${ (await new Network().get()).symbol }/gas`, query);
        // console.log(data)

        if (data.error && data.status == 403) {
            console.log(data);
            new ModalWindow({
                title: data.error,
                message: data.message,
                buttons: {
                    'LOGIN': () => menu.click('key'),
                    'CLOSE': () => {}
                }
            });
        }
        else {
            // console.log(data)
            this.onUpdate(data);
        }

        document.querySelectorAll('.gas').forEach(e => e.classList.remove('loading'));
        return data;
    }
};

gasTimer.beforeUpdate = () => {
    document.querySelectorAll('.gas').forEach((e, i) => {
        e.classList.add('loading');
        e.querySelector('.gwei').innerHTML = `00.000 GWei`;
        e.querySelector('.usd').innerHTML = `$ 00.0000`;
        e.querySelector('.base').innerHTML = 'Base: 00.00 GWei';
        e.querySelector('.tip').innerHTML = 'Tip: 00.00 GWei';
    });
}

gasTimer.onUpdate = data => {
    // console.log(data);
    if (!data.speeds) return;
    
    const typeGas = data.speeds.find(s => s.maxFeePerGas === undefined) ? 1 : 2;
    const info = {};
    info.gas = (() => {
        let gas = data.speeds.map(s => s.gasPrice || s.maxFeePerGas);
        gas = gas.map(g => g.toFixed(g == parseInt(g) ? 0 : Math.max(2, 1 + Math.ceil(Math.abs(Math.log10(g))))));
        gas = gas.map(g => g > 9999 ? parseInt(g) : g);
        return gas;
    })();
    info.fee = data.speeds.map(s => s.estimatedFee.toFixed(4));

    if (typeGas == 2) {
        info.base = data.speeds.map(s => s.baseFee.toFixed(2));
        info.tip = data.speeds.map(s => s.maxPriorityFeePerGas.toFixed(2));
    }
    
    document.querySelectorAll('.gas').forEach((e, i) => {
        e.querySelector('.gwei').innerHTML = `${info.gas[i]} GWei`;
        e.querySelector('.usd').innerHTML = `$ ${info.fee[i]}`;

        let base = '';
        let tip = '';
        if (typeGas == 2) {
            base = `Base: ${info.base[i]} GWei`;
            tip = `Tip: ${info.tip[i]} GWei`;
        }
        e.querySelector('.base').innerHTML = base;
        e.querySelector('.tip').innerHTML = tip;
    });
};

export default gasTimer;