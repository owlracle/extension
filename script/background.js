chrome.runtime.onMessage.addListener((message, sender, reply) => {
    // console.log(message)
    // received a message from contentScript to send notification
    if (message.event == 'notification-gas') {
        const gas = message.message.gas;

        let msgBody = '';
        if (gas.gasPrice) {
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
            title: 'Owlracle suggests:',
            message: msgBody,
        });    
    }
    return true; // only when return true the reply callback can be called async
});