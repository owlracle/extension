const messageBus = {
    events: {},

    watchDomMessage: async function(id) {
        return new Promise(resolve => {
            const checkInt = setInterval( () => {
                const extMessageContainer = document.querySelector('#' + id);
                if (extMessageContainer) {
                    const extMessage = extMessageContainer.value !== 'undefined' ? JSON.parse(extMessageContainer.value) : false;
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
        // console.log(message)
    
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

        if (reply){
            reply(response);
        }
    },
};
messageBus.watch();

const network = {
    list: [
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
    ],

    get: function() {
        this.selected = this.list.find(e => e.id == parseInt(window.ethereum.networkVersion));
        return this.selected;
    },

    onChange: function(callback) {
        this.changeCallback = callback;
    },

    changeWatcher: function() {
        setInterval(() => {
            const oldNetwork = this.selected;

            this.get();

            if (oldNetwork != this.selected) {
                if (this.changeCallback) {
                    this.changeCallback(this.selected);
                }
                // send a message to contentScript so it knows when network changed
                if (oldNetwork) {
                    messageBus.send('network', { network: this.selected.name });
                }
            }
        }, 100);
    },
};
network.changeWatcher();


const owlracle = {
    url: 'https://owlracle.info',
    // url: 'https://738e-179-152-6-27.ngrok.io',
    speed: 0,
    args: {
        accept: '75',
        source: 'advisor',
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

        const ntw = network.get();
        if (!ntw) {
            console.log('Network not supported');
            return false;
        }

        this.args.apikey = this.apiKey;
        const url = `${this.url}/${ ntw.name }/gas?${ new URLSearchParams(this.args).toString() }`;

        const req = await fetch(url);
        const res = await req.json();

        if (res.error) {
            return res;
        }

        const speedInfo = res.speeds[this.speed];
        if (speedInfo && speedInfo.gasPrice) {
            if (res.baseFee) {
                gasPrice = {
                    maxFeePerGas: speedInfo.gasPrice,
                    maxPriorityFeePerGas: Math.max(speedInfo.gasPrice - res.baseFee, 0),
                };
            }
            else {
                gasPrice = { gasPrice: speedInfo.gasPrice };
            }
            this.lastGas.set(gasPrice);
        }

        return gasPrice;
    },
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
            let change = false;
            if (method == 'eth_sendTransaction' && params && params[0]) {
                change = true;
            }
            if (change){
                // want to really send a new tx, so request gas price for it
                const gas = await owlracle.getGas();
                // console.log(gas);

                if (gas.error) {
                    console.log(`🦉 Owlracle encountered en error:`);
                    console.log(gas);
                }
                else if (gas.gasPrice) {
                    console.log(`🦉 Owlracle suggests: ${ gas.gasPrice } GWei`);
                    params[0].gasPrice = '0x'+ parseInt(gas.gasPrice * 1000000000).toString(16);
                    delete params[0].maxFeePerGas;
                    delete params[0].maxPriorityFeePerGas;
                }
                else if (gas.maxFeePerGas) {
                    console.log(`🦉 Owlracle suggests:`);
                    Object.entries(gas).forEach(([k,v]) => {
                        params[0][k] = '0x'+ parseInt(v * 1000000000).toString(16)
                        console.log(`${k}: ${v} GWei`);
                    });
                    delete params[0].gasPrice;
                }

                // background will listen to this and create a notification
                if (gas && owlracle.notifications){
                    messageBus.send('notification-gas', { gas: gas });
                }
            }
            // console.log(params);`
            const res = oldReq({ method: method, params: params });
            if (change) {
                res.then( hash => {
                    // in case I want to do something in the future
                });
            }
            return res;
        }
    };

    requestOverride(window.ethereum);

    messageBus.addEvent('advisor', message => {
        if (!owlracle.apiKey && message.apiKey) {
            console.log(`🦉 You are taking Owlracle's advice for gas price settings on your Metamask transactions 🦉`);
            console.log(`🦉 Check our website https://owlracle.info or get in touch at https://discord.gg/zYS4f8eRbC 🦉`);
        }
        
        // console.log(message)
        owlracle.apiKey = message.apiKey;
        owlracle.notifications = message.notifications;
    
        if (message.speed) {
            owlracle.args.accept = message.speed;
        }

        return true;
    });

    // send back network to popup
    messageBus.addEvent('get-network', () => {
        return network.get().name;
    });
}
else {
    console.log('Metamask not detected');
}