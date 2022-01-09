import { network, ModalWindow, cookies } from './utils.js';

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
                <div class="title">
                    <div class="left">${card.name}</div>
                </div>
                <div class="body">
                    <div class="gwei"><i class="fas fa-spin fa-cog"></i></div>
                    <div class="usd"></div>
                </div>
            </div>`;
            container.insertAdjacentHTML('beforeend', dom);
        });
    },

    update: async function () {
        this.beforeUpdate();

        let query = {
            apikey: cookies.get('apikey'),
            accept: this.cards.map(e => e.accept).join(','),
        };

        if (this.blocks) {
            query.blocks = this.blocks;
        }
        if (this.percentile) {
            query.percentile = this.percentile;
        }

        query = new URLSearchParams(query).toString();
        const data = await (await fetch(`https://owlracle.info/${network.get().symbol}/gas?${query}`)).json();

        if (data.error) {
            console.log(data);
            new ModalWindow({
                title: data.error,
                message: `<p>${data.message}</p><p>Reopen this window and try again.</p>`,
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
    const gas = data.speeds.map(s => s.gasPrice.toFixed(s.gasPrice == parseInt(s.gasPrice) ? 0 : 2));
    const fee = data.speeds.map(s => s.estimatedFee.toFixed(4));

    document.querySelectorAll('.gas .body').forEach((e, i) => {
        if (data.speeds) {
            e.querySelector('.gwei').innerHTML = `${gas[i]} GWei`;
            e.querySelector('.usd').innerHTML = `$ ${fee[i]}`;
        }
    });
};

export default gasTimer;