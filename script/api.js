import { cookies, ModalWindow, menu } from './utils.min.js';

const api = {
    footer: `
        <a class="item" href="https://github.com/owlracle" target="_blank"><i class="fa-brands fa-github"></i></a>
        <a class="item" href="https://t.me/owlracle" target="_blank"><i class="fa-brands fa-telegram"></i></a>
        <a class="item" href="https://twitter.com/owlracleapi" target="_blank"><i class="fa-brands fa-twitter"></i></a>
        <a class="item" href="https://facebook.com/owlracle" target="_blank"><i class="fa-brands fa-facebook"></i></a>
        <a class="item" href="https://medium.com/@owlracleapi" target="_blank"><i class="fa-brands fa-medium"></i></a>
    `,

    check: function() {
        const logged = cookies.get('logged');
        if (!logged){
            this.showWelcome();
            return false;
        }

        cookies.refresh('logged');
        this.showInfo();
        return true;
    },

    // welcome page, when user is not logged
    showWelcome: function() {
        const container = document.querySelector('#content #key.item');

        container.innerHTML = `
            <div id="content">
                <h1>Welcome to <span id="site-name">Owlracle</span>!</h1>
                <h2>The Multichain Gas Price Tracker</h2>
                <a href="https://owlracle.info" target="_blank"><img id="logo" src="https://owlracle.info/img/owl.webp"></a>
                <button id="new">Create New Api Key</button>
                <button id="login">Login with Existing Api Key</button>
                <button id="guest">Continue as Guest</button>
            </div>
            <div id="footer">${this.footer}</div>
        `;

        menu.hide();

        // continue as guest
        container.querySelector('#guest').addEventListener('click', () => {
            new ModalWindow({
                title: 'Warning',
                message: `Guest users have a much lower request limit. Are you sure you want to go without an api key?`,
                buttons: {
                    'YES': () => {
                        menu.show().click('gas');
                        cookies.set('logged', true);
                    },
                    'NO': () => {},
                }
            })
        });

        // login with existing api
        container.querySelector('#login').addEventListener('click', () => {
            this.showInfo();
        });

        // create new api key
        container.querySelector('#new').addEventListener('click', () => {
            this.newApiKey();
        });
    },

    // info page, when user is logged as guest
    showInfo: async function() {
        const apiKey = cookies.get('apikey');

        if (!apiKey) {
            this.showGuestInfo();
            return;
        }

        const container = document.querySelector('#content #key');
        
        // puts loading animation only it is not already showing old api key information
        if (!container.querySelector('#content') || !container.querySelector('#content').classList.contains('key-info')){
            container.innerHTML = '<i class="fas fa-spin fa-cog"></i>';
            container.classList.add('loading');
        }

        const data = await (await fetch(`https://owlracle.info/keys/${apiKey}`)).json();
        if (data.error){
            new ModalWindow({
                title: 'Session expired',
                message: 'Your session has expired. Please log in again with your api key.'
            });

            cookies.delete('apikey');
            cookies.delete('logged');
            menu.click('key');
            return;
        }

        cookies.refresh('apikey');

        container.classList.remove('loading');
        container.innerHTML = `
            <div id="content" class="logged key-info">
                <div class="row">
                    <span>Api Key</span>
                    <span>Credit</span>
                </div>
                <div class="row">
                    <input value="${data.apiKey.slice(0,4)}...${data.apiKey.slice(-4)}" readonly>
                    <input value="$${parseFloat(data.credit).toFixed(4)}" readonly>
                </div>
                <div class="row">
                    <span>Usage 1h</span>
                    <span>Usage Total</span>
                </div>
                <div class="row">
                    <input value="${data.usage.apiKeyHour}" readonly>
                    <input value="${data.usage.apiKeyTotal}" readonly>
                </div>
                <button id="logout"><i class="fa-solid fa-right-from-bracket"></i>LOGOUT</button>
                <a href="https://owlracle.info/?action=keys&apikey=${data.apiKey}" target="_blank">Visit owlracle.info for more information</a>
            </div>
            <div id="footer" class="logged">${this.footer}</div>
        `;

        container.querySelector('#logout').addEventListener('click', () => {
            cookies.delete('apikey');
            cookies.delete('logged');
            menu.click('key');
        })
    },

    showGuestInfo: function() {
        const logged = cookies.get('logged');

        const container = document.querySelector('#content #key');
        container.innerHTML = `<div id="content" class="logged">
            <span>${ logged ? `Log in with an api key to increase your request limit` : `Log in using your api key` }</span>
            <input placeholder="YOUR_API_KEY">
            <span id="tip"></span>
            <button id="login"><i class="fa-solid fa-right-to-bracket"></i>LOG IN</button>
            ${ logged ? `
                <span class="small">or</span>
                <a>Create New Api Key</a>
            ` : `
                <button id="back"><i class="fa-solid fa-arrow-left"></i>BACK</button>
            `}
        </div>`;
        
        const input = container.querySelector('input');
        const button = container.querySelector('#login');
        const linkNew = container.querySelector('a');
        const regex = new RegExp(/^[a-f0-9]{32}$/);

        input.focus();

        // when typing
        input.addEventListener('input', () => {
            if (input.value.match(regex)){
                this.hideTip();
            }
        });
        
        // when pressing enter key
        input.addEventListener('keypress', e => {
            if (e.key == 'Enter'){
                button.click();
            }
        });

        // when click button to login
        button.addEventListener('click', async () => {
            if (!input.value.match(regex)){
                this.showTip('Invalid api key format');
                return;
            }

            const text = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spin fa-cog"></i>';
            const data = await (await fetch(`https://owlracle.info/keys/${input.value.toLowerCase()}`)).json();
            button.innerHTML = text;
            if (data.error && data.status == 401){
                this.showTip('Could not find your api key');
                return;
            }

            cookies.set('logged', true);
            cookies.set('apikey', data.apiKey);
            menu.show().click('gas');
        });

        if (logged){
            linkNew.addEventListener('click', async () => {
                this.newApiKey();
            });
        }
        else{
            container.querySelector('#back').addEventListener('click', async () => menu.click('key'));
        }
    },

    showTip: function(message) {
        const container = document.querySelector('#content #key');
        const input = container.querySelector('input');
        const tip = container.querySelector('#tip');

        input.classList.add('red');
        tip.classList.add('show');
        tip.innerHTML = message;
        input.focus();
    },
    
    hideTip: function() {
        const container = document.querySelector('#content #key');
        const input = container.querySelector('input');
        const tip = container.querySelector('#tip');

        input.classList.remove('red');
        tip.classList.remove('show');
    },

    newApiKey: function() {
        window.open('https://owlracle.info/?action=newkey');
    }
}

export default api;