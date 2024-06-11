import Message from "./helpers/message.js";

// set advisor storage when extension installed
chrome.runtime.onInstalled.addListener( () => {
    chrome.storage.local.set({ advisor: { enabled: false } });

    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: '../img/icon-128.png',
        title: 'Owlracle is installed',
        message: 'Click on the icon to check all the options',
    });  
});

new Message('notification-gas').listen(async message => {
    // console.log(message)
    // received a message from contentScript to send notification
    const gas = message.gas;

    let msgBody = '';
    let title = 'Owlracle suggests:';
    if (gas.error) {
        msgBody = gas.message;
        title = gas.error;
    }
    else if (gas.gasPrice) {
        gas.gasPrice = gas.gasPrice == parseInt(gas.gasPrice) ? gas.gasPrice : gas.gasPrice.toFixed(2);
        msgBody = `${ gas.gasPrice } GWei`;
    }
    else if (gas.maxFeePerGas) {
        msgBody += `Max Fee: ${ gas.maxFeePerGas.toFixed(2) } GWei\n`;
        msgBody += `Priority Fee: ${ gas.maxPriorityFeePerGas.toFixed(2) } GWei\n`;
    }

    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: '../img/icon-128.png',
        title,
        message: msgBody,
    });    
});