import Message from "./helpers/message.js";
import MessageDOM from "./helpers/messageDom.js";

// code to inject script into DOM
const script = document.createElement('script');
script.src = chrome.runtime.getURL('dist/inject.min.js');
script.type = 'module';
(document.head||document.documentElement).appendChild(script);
script.onload = () => script.remove();
// console.log('contentScript loaded');


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

        const message = {};

        if (advProp.enabled) {
            if (advProp.apiKey) {
                message.apiKey = advProp.apiKey;
            }
            if (advProp.speed) {
                message.speed = advProp.speed;
            }
            if (advProp.notifications) {
                message.notifications = advProp.notifications;
            }
        }
        else if (!init) {
            message.apiKey = false;
        }

        new MessageDOM('advisor').send(message);
    },
};


// listen to popup, once message received create dom element to inject retrieve it
new Message('advisor').listen(async message => {
    // console.log(message)
    // received a message from popup to update advisor info
    await advisor.updateDOM();
    return true;
});

// set api key when page load
advisor.updateDOM(true);


// route messages from inject to popup
new MessageDOM([
    'network',
]).listen(async (message, channel) => {
    // console.log('listener', message, channel);
    new Message(channel).send(message);
});

// route messages from inject to background
new MessageDOM([
    'notification-gas',
]).listen(async (message, channel) => {
    // console.log('listener', message, channel);
    new Message(channel, true).send(message);
});

// route messages from popup to inject
new Message([
    'get-network',
]).listen(async (message, channel) => {
    // console.log('listener', message, channel);
    const response = await new MessageDOM(channel).send(message);
    // console.log('response', response)
    return response;
});