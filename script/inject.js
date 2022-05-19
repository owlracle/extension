const messageBus = {
    events: {},

    watchDomMessage: async function(id) {
        return new Promise(resolve => {
            const checkInt = setInterval( () => {
                const extMessageContainer = document.querySelector('#' + id);
                if (extMessageContainer) {
                    const extMessage = JSON.parse(extMessageContainer.value);
                    extMessageContainer.remove();
                    clearInterval(checkInt);
                    resolve(extMessage);
                }
            }, 100);
        });
    },

    // watch for dom for received messages from contentScript
    watch: async function() {
        const message = await this.watchDomMessage('extension-message-received');
    
        let replyMsg = 'Message received, but no reply given';
        if (message.event && this.events[message.event]) {
            replyMsg = await this.events[message.event](message);
        }
        this.writeDomMessage('extension-message-received-reply', replyMsg);
    
        setTimeout(() => this.watch(), 100);
    },

    // add event listener: function to be called when messages are received
    addEvent: function(name, callback) {
        this.events[name] = callback;
    },

    writeDomMessage: function(id, message) {
        const el = document.createElement('input');
        el.id = id;
        el.type = 'hidden';
        el.value = JSON.stringify(message);
        document.body.insertAdjacentElement('beforeend', el);
    },

    // send message to DOM to contentScript
    send: async function(event, message, reply) {
        this.writeDomMessage('extension-message-sent', { event: event, message: message });

        const response = await this.watchDomMessage('extension-message-sent-reply');
        reply(response);
    },
};
messageBus.watch();


const owlracle = {
    url: 'https://owlracle.info',
    speed: 0,
    args: { accept: "75" },

    getNetwork: function() {
        const networks = [
            { name: 'eth', id: 1 },
            { name: 'bsc', id: 56 },
            { name: 'poly', id: 137 },
            { name: 'ftm', id: 250 },
            { name: 'avax', id: 43114 },
            { name: 'cro', id: 25 },
            { name: 'movr', id: 1285 },
            { name: 'one', id: 166660000 },
            { name: 'ht', id: 128 },
            { name: 'celo', id: 42220 },
            { name: 'fuse', id: 122 },
        ];

        this.network = networks.find(e => e.id == parseInt(window.ethereum.networkVersion)).name;

        return this.network;
    },

    lastGas: {
        expire: 10000,

        get: async function() {
            // implement a mutex
            // wait for the lock release
            await new Promise(resolve => {
                const check = () => {
                    if (!this.locked) {
                        resolve(true);
                    }
                    setTimeout(() => check(), 100);
                };
                check();
            });
            
            const now = new Date().getTime();
            
            // there a gas price not yet expired
            if (this.value && now - this.time < this.expire) {
                return this.value;
            }
            
            // lock only if there is not gas price ready (need to fetch)
            this.locked = true;
            return false;
        },

        set: function(value) {
            this.value = value;
            this.time = new Date().getTime();
            this.locked = false;
        },
    },

    getGas: async function() {
        if (!this.apiKey) {
            console.log('No Owlracle API key provided');
            return false;
        }
        // return last gas price known or false
        let gasPrice = await this.lastGas.get();
        if (gasPrice) {
            return gasPrice;
        }

        const args = this.args ? '&' + new URLSearchParams(this.args).toString() : '';
        const url = `${this.url}/${ this.getNetwork() }/gas?apikey=${this.apiKey}${args}`;

        if (this.verbose) {
            console.log(`Requesting ${url}`);
        }

        const req = await fetch(url);
        const res = await req.json();

        if (res.speeds[this.speed] && res.speeds[this.speed].gasPrice) {
            gasPrice = res.speeds[this.speed].gasPrice;
            this.lastGas.set(gasPrice);
        }

        return gasPrice;
    }
}

if (window.ethereum) {
    // console.log(window.ethereum)

    const requestOverride = ethereum => {
        // console.log(ethereum)
        
        // Metamask expose window.ethereum.
        // All contract interactions go through window.ethereum.request
        // I replace the old request method for one calling the old requests, but replcing the gasPrice argument
        const oldReq = ethereum.request;
        ethereum.request = async ({method, params}) => {
            if (method == 'eth_sendTransaction' && params && params[0]) {
                // want to really send a new tx, so request gas price for it
                const gasPrice = await owlracle.getGas();
                if (gasPrice) {
                    params[0].gasPrice = '0x'+ parseInt(gasPrice * 1000000000).toString(16);
                    console.log(`🦉 Owlracle suggests: ${ gasPrice } GWei`);
                }
            }
            // console.log(params);
            return oldReq({ method: method, params: params });
        }
    };

    requestOverride(window.ethereum);

    console.log(`🦉 You are taking Owlracle's advice for gas price settings on your Metamask transactions 🦉`);
    console.log(`🦉 Check our website https://owlracle.info or get in touch at https://t.me/owlracle 🦉`);

    messageBus.addEvent('apikey', message => {
        owlracle.apiKey = message.apiKey;
        return true;
    });
}
else {
    console.log('Metamask not detected');
}