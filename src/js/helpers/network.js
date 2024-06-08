import storage from "./storage.js";

// set the corresponding network in header
export default {
    list: {
        eth: { symbol: 'eth', name: 'Ethereum' },
        bsc: { symbol: 'bsc', name: 'BSC' },
        poly: { symbol: 'poly', name: 'Polygon' },
        ftm: { symbol: 'ftm', name: 'Fantom' },
        avax: { symbol: 'avax', name: 'Avalanche' },
        cro: { symbol: 'cro', name: 'Cronos' },
        movr: { symbol: 'movr', name: 'Moonriver' },
        one: { symbol: 'one', name: 'Harmony' },
        ht: { symbol: 'ht', name: 'Heco' },
        celo: { symbol: 'celo', name: 'Celo' },
        fuse: { symbol: 'fuse', name: 'Fuse' },
    },

    get: async function (name) {
        if (!name) {
            name = (await storage.get('network')) || 'eth';
        }

        return this.list[name];
    },

    set: function (name) {
        storage.set('network', name);
    },

    getList: function () {
        return this.list;
    }
}