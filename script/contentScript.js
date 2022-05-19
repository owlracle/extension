// code to inject script into DOM
const script = document.createElement('script');
script.src = chrome.runtime.getURL('script/inject.min.js');
script.type = 'module';
(document.head||document.documentElement).appendChild(script);
script.onload = () => script.remove();
// console.log('contentScript loaded');

const watchDomMessage = async id => {
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
}

const writeDomMessage = (id, message) => {
    const el = document.createElement('input');
    el.id = id;
    el.type = 'hidden';
    el.value = JSON.stringify(message);
    document.body.insertAdjacentElement('beforeend', el);
}


// write dom message and wait for reply
const sendToDOM = async message => {
    writeDomMessage('extension-message-received', message);
    // watch for reply from inject, and send reply back to popup
    return await watchDomMessage('extension-message-received-reply');
};


// listen to popup, once message received create dom element to inject retrieve it
chrome.runtime.onMessage.addListener((message, sender, reply) => {
    // console.log(message)
    sendToDOM(message).then(response => reply(response));
    return true; // only when return true the reply callback can be called async
});

const watch = async () => {
    // watch for messages sent from inject, so send them to popup
    const message = await watchDomMessage('extension-message-sent');

    // send message to popup and wait for reply to put the reply on dom
    chrome.runtime.sendMessage(message, response => {
        writeDomMessage('extension-message-sent-reply', response);
    });

    setTimeout(() => watch(), 100);
}
watch();

(async () => {
    // set api key when page load
    let storage = await chrome.storage.local.get();

    if (storage.apikey) {
        sendToDOM({ event: 'apikey', apiKey: storage.apikey });
    }
})();
