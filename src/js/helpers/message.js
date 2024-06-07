export default {
    events: {},

    // watch from message from contentScript
    watch: async function() {
        chrome.runtime.onMessage.addListener((message, sender, reply) => {
            // console.log(sender)
            
            let replyMsg = 'Message received';
            if (this.events[message.event]) {
                replyMsg = this.events[message.event](message);
            }

            if (reply){
                reply(replyMsg);
            }
        });
    },

    // add event listener: function to be called when messages are received
    addEvent: function(name, callback) {
        this.events[name] = callback;
    },

    // send to contentScript
    send: function(event, message, reply, background=false) {
        // console.log(event, message)
        if (background) {
            chrome.runtime.sendMessage({ event: event, message: message }, response => {
                if (reply) {
                    reply(response);
                }
            });
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { event: event, message: message }, response => {
                // console.log(response)
                if (reply) {
                    reply(response);
                }
            });
        });
    },
}