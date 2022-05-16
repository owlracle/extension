// code to inject script into DOM
const script = document.createElement('script');
script.src = chrome.runtime.getURL('script/inject.min.js');
script.type = 'module';
(document.head||document.documentElement).appendChild(script);
script.onload = () => script.remove();
// console.log('contentScript loaded');

chrome.runtime.onMessage.addListener((message, sender, reply) => {
    // console.log(message)
    const el = document.createElement('input');
    el.id = 'extension-message';
    el.type = 'hidden';
    el.value = JSON.stringify(message);
    document.body.insertAdjacentElement('beforeend', el);
    reply('');
});
