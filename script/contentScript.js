// code to inject script into DOM
const script = document.createElement('script');
script.src = chrome.runtime.getURL('script/inject.min.js');
script.type = 'module';
(document.head||document.documentElement).appendChild(script);
script.onload = () => script.remove();
// console.log('contentScript loaded');

const messageDOM = {
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
    
    writeDomMessage: function(id, message) {
        const el = document.createElement('input');
        el.id = id;
        el.type = 'hidden';
        el.value = JSON.stringify(message);
        document.body.insertAdjacentElement('beforeend', el);
    },
    
    
    // write dom message and wait for reply
    send: async function(message) {
        // console.log(message)
        this.writeDomMessage('extension-message-received', message);
        // watch for reply from inject, and send reply back to popup
        return await this.watchDomMessage('extension-message-received-reply');
    },
    
    watch: async function() {
        // watch for messages sent from inject, so send them to popup
        const message = await this.watchDomMessage('extension-message-sent');
    
        // send message to popup and wait for reply to put the reply on dom
        chrome.runtime.sendMessage(message, response => {
            // console.log(message, response)
            this.writeDomMessage('extension-message-sent-reply', response);
        });
    
        setTimeout(() => this.watch(), 100);
    },
}
messageDOM.watch();


// listen to popup, once message received create dom element to inject retrieve it
chrome.runtime.onMessage.addListener((message, sender, reply) => {
    // console.log(message)

    // received a message from popup to update advisor info
    if (message.event == 'advisor') {
        advisor.updateDOM().then(() => reply('ok'));
    }
    else {
        messageDOM.send(message).then(response => reply(response));
    }

    return true; // only when return true the reply callback can be called async
});


// advisor config and methods
const advisor = {
    // set starting state for advisor properties
    // receive storage if exists, or set a new one if doesnt
    init: async function() {
        const storage = await chrome.storage.local.get();

        if (storage.advisor && typeof storage === 'object') {
            return storage.advisor;
        }

        await chrome.storage.local.set({ advisor: { enabled: false } });
        return { enabled: false };
    },

    // same as init, but wait until there is a storage available
    get: async function() {
        const storage = await chrome.storage.local.get();
        // return the storage var, or wait until it is ready
        return storage.advisor || await new Promise(resolve => setTimeout(async () => resolve(await this.get()), 100));
    },

    updateDOM: async function(init=false) {
        const advProp = await (init ? this.init() : this.get());

        const message = { event: 'advisor' };

        if (advProp.enabled && advProp.apiKey) {
            message.apiKey = advProp.apiKey;
        }
        else if (!init) {
            message.apiKey = false;
        }

        messageDOM.send(message);
    },
};


// set api key when page load
advisor.updateDOM(true);
