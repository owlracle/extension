// set advisor storage when extension installed
chrome.runtime.onInstalled.addListener( () => {
    chrome.storage.local.set({ advisor: { enabled: false } });
});

chrome.runtime.onMessage.addListener((message, sender, reply) => {
    // console.log(message)
    // received a message from contentScript to send notification
    if (message.event == 'notification-gas') {
        const gas = message.message.gas;

        let msgBody = '';
        if (gas.error) {
            msgBody = gas.message;
            title = gas.error;
        }
        else if (gas.gasPrice) {
            gas.gasPrice = gas.gasPrice == parseInt(gas.gasPrice) ? gas.gasPrice : gas.gasPrice.toFixed(2);
            msgBody = `${ gas.gasPrice } GWei`;
            title = 'Owlracle suggests:';
        }
        else if (gas.maxFeePerGas) {
            msgBody += `Max Fee: ${ gas.maxFeePerGas.toFixed(2) } GWei\n`;
            msgBody += `Priority Fee: ${ gas.maxPriorityFeePerGas.toFixed(2) } GWei\n`;
            title = 'Owlracle suggests:';
        }

        chrome.notifications.create('', {
            type: 'basic',
            iconUrl: '../img/icon-128.png',
            title: title,
            message: msgBody,
        });    
    }
    return true; // only when return true the reply callback can be called async
});