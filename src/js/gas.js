import Request from './helpers/request.js';
import Network from './helpers/network.js';
import ModalWindow from './components/modal.js';
import menu from './components/menu.js';
import login from './helpers/login.js';

const gasTimer = {
    cards: [ // preferences for cards
        { name: '🛴Slow', accept: 35 },
        { name: '🚗Standard', accept: 60 },
        { name: '✈️Fast', accept: 90 },
        { name: '🚀Instant', accept: 100 },
    ],

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
    },

    update: async function () {
        this.beforeUpdate();

        let query = {
            accept: this.cards.map(e => e.accept).join(','),
            source: 'extension',
            eip1559: false,
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
        return data;
    }
};

gasTimer.beforeUpdate = () => {
    document.querySelectorAll('.gas .body').forEach((e, i) => {
        e.querySelector('.gwei').innerHTML = `<i class="fas fa-spin fa-cog"></i>`;
        e.querySelector('.usd').innerHTML = ``;
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