export default class Message {
    static events = {};
    static watching = false;

    constructor(channels = [], background = false) {
        this.channels = Array.isArray(channels) ? channels : [channels];
        this.background = background;

        if (!Message.watching) {
            Message.watchFromPopup();
            Message.watching = true;
        }
    }

    static watchFromPopup() {
        chrome.runtime.onMessage.addListener((message, sender, reply) => {
            // console.log('message from popup', message);
            if (message.channel && Message.events[message.channel]) {
                Message.events[message.channel](message.message, message.channel).then(response => {
                    // console.log('replyMsg from popup', message, response, Object.keys(Message.events));
                    reply(response);
                });
            }
            else {
                reply(null);
            }
            return true;
        });
    }

    async listen(callback) {
        this.channels.forEach(channel => Message.events[channel] = callback);
    }

    async send(message, reply = () => {}) {
        let replyList = [];
        this.channels.forEach(channel => {
            const replyPopup = this.sendToPopup(channel, message);
            replyList.push(replyPopup);
        });
        replyList = (await Promise.all(replyList)).find(reply => reply !== null);
        // console.log('replyList', replyList)
        reply(replyList);
    }

    async sendToPopup(channel, message) {
        // console.log('sendToPopup', channel, message, background)
        if (this.background) {
            return new Promise(async resolve => {
                const response = await chrome.runtime.sendMessage({ channel, message });
                // console.log('response from popup 1', response)
                resolve(response);
            });
        }

        return new Promise(async resolve => {
            if (!chrome.tabs) return resolve(null);
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tabs[0].id, { channel, message });
            // console.log('response from popup 2', response);
            resolve(response);
        });
    }

}