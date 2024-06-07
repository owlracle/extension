import storage from "./storage.js";

// set the corresponding network in header
export default {
    list: {
        eth: { symbol: 'eth', name: 'Ethereum', token: 'ETH', explorer: {
            icon: 'https://etherscan.io/images/favicon3.ico', href: 'https://etherscan.io', name: 'Etherscan', apiAvailable: true,
        } },
        bsc: { symbol: 'bsc', name: 'BSC', longName: 'Binance Smart Chain', token: 'BNB', explorer: {
            icon: 'https://bscscan.com/images/favicon.ico', href: 'https://bscscan.com', name: 'BscScan', apiAvailable: true,
        } },
        poly: { symbol: 'poly', name: 'Polygon', token: 'MATIC', explorer: {
            icon: 'https://polygonscan.com/images/favicon.ico', href: 'https://polygonscan.com', name: 'PolygonScan', apiAvailable: true,
        } },
        ftm: { symbol: 'ftm', name: 'Fantom', token: 'FTM', explorer: {
            icon: 'https://ftmscan.com/images/favicon.png', href: 'https://ftmscan.com', name: 'FtmScan', apiAvailable: true,
        } },
        avax: { symbol: 'avax', name: 'Avalanche', token: 'AVAX', explorer: {
            icon: 'https://snowtrace.io/images/favicon.ico', href: 'https://snowtrace.io', name: 'SnowTrace', apiAvailable: true,
        } },
        cro: { symbol: 'cro', name: 'Cronos', token: 'CRO', explorer: {
            icon: 'https://cronoscan.com/images/favicon.ico', href: 'https://cronoscan.com/', name: 'Cronoscan', apiAvailable: true,
        } },
        movr: { symbol: 'movr', name: 'Moonriver', token: 'MOVR', explorer: {
            icon: 'https://moonriver.moonscan.io/images/favicon.ico', href: 'https://moonriver.moonscan.io/', name: 'MoonScan', apiAvailable: true,
        } },
        one: { symbol: 'one', name: 'Harmony', token: 'ONE', explorer: {
            icon: 'https://explorer.harmony.one/favicon.ico', href: 'https://explorer.harmony.one', name: 'Harmony Explorer', apiAvailable: false,
        } },
        ht: { symbol: 'ht', name: 'Heco', token: 'HT', explorer: {
            icon: 'https://hecoinfo.com/favicon.ico', href: 'https://hecoinfo.com', name: 'HecoInfo', apiAvailable: false,
        } },
        celo: { symbol: 'celo', name: 'Celo', token: 'CELO', explorer: {
            icon: 'https://avatars.githubusercontent.com/u/37552875?s=200&v=4', href: 'https://explorer.celo.org', name: 'Celo Explorer', apiAvailable: false,
        } },
        fuse: { symbol: 'fuse', name: 'Fuse', token: 'FUSE', explorer: {
            icon: 'https://explorer.fuse.io/images/favicon-543fd97558f89019d8ee94144a7e46c7.ico?vsn=d', href: 'https://explorer.fuse.io/', name: 'Fuse Explorer', apiAvailable: false,
        } },
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