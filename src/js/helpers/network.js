import storage from "./storage.js";
import Request from "./request.js";

// set the corresponding network in header
export default class Network {
    
    static list = {};

    constructor(network) {
        this.network = network;
    }

    static async getList() {
        if (!Network.list || Object.keys(Network.list).length == 0) {
            const networkList = await new Request().get('rpc');
            Network.list = {};
            networkList.forEach(network => {
                Network.list[network.network] = {
                    symbol: network.network,
                    name: network.name.charAt(0).toUpperCase() + network.name.slice(1),
                };
            });
        }
        return Network.list;
    }

    async get() {
        if (!this.network) {
            this.network = (await storage.get('network')) || 'eth';
        }

        return (await Network.getList())[this.network];
    }

    set(network) {
        this.network = network;
        storage.set('network', this.network);
    }
}