import Request from "./helpers/request.js";
import Message from "./helpers/messageDom.js";

const network = {
    get: function() {
        if (!window.ethereum) return null;
        this.selected = parseInt(window.ethereum.networkVersion);
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
                    new Message('network').send({ network: this.selected });
                }
            }
        }, 1000);
    },
};


const owlracle = {
    url: 'https://owlracle.info',
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
        const res = await new Request().get(`${ ntw }/gas`, this.args);

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
    network.changeWatcher();

    const requestOverride = ethereum => {
        // console.log(ethereum)
        
        // Metamask expose window.ethereum.
        // All contract interactions go through window.ethereum.request
        // I replace the old request method for one calling the old requests, but replacing the gasPrice argument
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
                    new Message('notification-gas').send({ gas: gas });
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
    
    new Message('advisor').listen(message => {
        if (!owlracle.apiKey && message.apiKey) {
            console.log(`🦉 You are taking Owlracle's advice for gas price settings on your Metamask transactions 🦉`);
            console.log(`🦉 Check our website ${owlracle.url} or get in touch at ${owlracle.url}/discord-support 🦉`);
        }
        
        // console.log(message)
        owlracle.apiKey = message.apiKey;
        owlracle.notifications = message.notifications;
    
        if (message.speed) {
            owlracle.args.accept = message.speed;
        }

        return true;
    });
}
else {
    console.log('Metamask not detected');
}

// send back network to popup
new Message('get-network').listen(() => {
    // console.log('message received', network.get());
    return network.get() || false;
});
