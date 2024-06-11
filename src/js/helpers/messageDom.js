export default class MessageDOM {
    static events = {};
    static watching = false;
    static domId = 'extension-message';

    constructor(channels = []) {
        this.channels = Array.isArray(channels) ? channels : [channels];

        if (!MessageDOM.watching) {
            MessageDOM.watchFromInject();
            MessageDOM.watching = true;
        }
    }

    static async watchFromInject() {
        const messagePack = await MessageDOM.watchDOMMessage(MessageDOM.domId);
        // console.log('message received from inject:', messagePack);

        let replyMsg = null;
        // console.log('events:', MessageDOM.events);
        if (messagePack.channel && MessageDOM.events[messagePack.channel]) {
            replyMsg = await MessageDOM.events[messagePack.channel](messagePack.message, messagePack.channel);
            MessageDOM.removeDOMMessage(MessageDOM.domId);
            // console.log('replyMsg from inject:', replyMsg);
        }

        MessageDOM.writeDOMMessage(`${MessageDOM.domId}-reply-${messagePack.id}`, replyMsg);

        setTimeout(() => this.watchFromInject(), 100);
    }

    static async watchDOMMessage(id) {
        return new Promise(resolve => {
            const checkInt = setInterval( () => {
                const extMessageContainer = document.querySelectorAll('#'+ id);
                if (!extMessageContainer) return;
                    
                for (let i in extMessageContainer) {
                    try {
                        const extMessage = JSON.parse(extMessageContainer[i].value);
                        if (!extMessage) continue;
                        clearInterval(checkInt);
                        resolve(extMessage);
                    }
                    catch(err) {
                        continue;
                    }
                }
            }, 100);
        });
    }

    static removeDOMMessage(id) {
        const extMessageContainer = document.querySelectorAll('#'+ id);
        if (extMessageContainer) {
            extMessageContainer.forEach(el => el.remove());
        }
    }

    static writeDOMMessage(id, message) {
        // insert message into DOM
        const el = document.createElement('input');
        el.id = id;
        el.type = 'hidden';
        el.value = JSON.stringify(message);
        document.body.insertAdjacentElement('beforeend', el);
    }


    async listen(callback) {
        this.channels.forEach(channel => MessageDOM.events[channel] = callback);
    }

    async send(message, reply = () => {}) {
        let replyList = [];
        this.channels.forEach(channel => {
            const replyInject = this.sendToInject(channel, message);
            replyList.push(replyInject);
        });
        replyList = await Promise.all(replyList);
        // console.log('replyLis from dom', replyList)
        replyList = replyList.find(reply => reply !== null);
        reply(replyList);
        return replyList;
    }

    async sendToInject(channel, message) {
        const id = Math.random().toString(36).substr(2, 9);
        MessageDOM.writeDOMMessage(MessageDOM.domId, { id, channel, message });
        // console.log('message sent to inject:', { id, channel, message });
        // watch for reply from inject
        const messageId = `${MessageDOM.domId}-reply-${id}`;
        const replyMessage = await MessageDOM.watchDOMMessage(messageId);
        // console.log('reply from inject:', replyMessage)
        if (replyMessage) {
            MessageDOM.removeDOMMessage(messageId);
        }

        return replyMessage;
    }

}