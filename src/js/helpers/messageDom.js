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

        function getDOMMessage(id) {
            const extMessageContainer = document.querySelector('#'+ id);
            // console.log('extMessageContainer:', extMessageContainer);
            if (!extMessageContainer || !extMessageContainer.value) return null;

            try {
                const extMessage = JSON.parse(extMessageContainer.value);
                // console.log('extMessage:', extMessage, id)
                return extMessage;
            }
            catch(err) {
                return null;
            }
        }

        const response = await new Promise(resolve => {
            const interval = setInterval(() => {
                const extMessage = getDOMMessage(id);
                // console.log('extMessage:', extMessage, id)
                if (extMessage !== null) {
                    clearInterval(interval);
                    resolve(extMessage);
                }
            }, 100)
        });
        // console.log('response from dom:', response);
        return response;
    }

    static removeDOMMessage(id) {
        const extMessageContainer = document.querySelector('#'+ id);
        if (extMessageContainer) {
            extMessageContainer.remove();
        }
    }

    static writeDOMMessage(id, message) {
        if (message == null) return;
        message = JSON.stringify(message);

        // insert message into DOM
        const el = document.createElement('input');
        el.id = id;
        el.type = 'hidden';
        el.value = message;
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
        const id = Math.random().toString(36).slice(2, 10);
        MessageDOM.writeDOMMessage(MessageDOM.domId, { id, channel, message });
        // console.log('message sent to inject:', { id, channel, message });
        // watch for reply from inject
        const messageId = `${MessageDOM.domId}-reply-${id}`;
        const replyMessage = await MessageDOM.watchDOMMessage(messageId);
        // console.log('reply from inject:', replyMessage);
        if (replyMessage !== null) {
            MessageDOM.removeDOMMessage(messageId);
        }

        return replyMessage;
    }

}