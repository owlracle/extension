import { cookies, ModalWindow, menu } from './utils.js';

const api = {
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
            <div id="footer">
                <a class="item" href="https://github.com/owlracle" target="_blank"><i class="fa-brands fa-github"></i></a>
                <a class="item" href="https://t.me/owlracle" target="_blank"><i class="fa-brands fa-telegram"></i></a>
                <a class="item" href="https://twitter.com/owlracleapi" target="_blank"><i class="fa-brands fa-twitter"></i></a>
                <a class="item" href="https://facebook.com/owlracle" target="_blank"><i class="fa-brands fa-facebook"></i></a>
                <a class="item" href="https://medium.com/@owlracleapi" target="_blank"><i class="fa-brands fa-medium"></i></a>
            </div>
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
                        cookies.set('logged', true, { json: true });
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
    showInfo: function() {
        const apiKey = cookies.get('apikey');

        if (!apiKey) {
            this.showGuestInfo();
            return;
        }

        cookies.refresh('apikey');
        console.log('logged in');
        const container = document.querySelector('#content #key');
        container.innerHTML = '';
    },

    showGuestInfo: function() {
        const logged = cookies.get('logged');

        const container = document.querySelector('#content #key');
        container.innerHTML = `<div id="content" class="logged">
            <span>${ logged ? `Log in with an api key to increase your request limit` : `Log in using your api key` }</span>
            <input placeholder="YOUR_API_KEY">
            <span id="tip"></span>
            <button id="login">LOG IN</button>
            ${ logged ? `
                <span class="small">or</span>
                <a>Create New Api Key</a>
            ` : `
                <button id="back">BACK</button>
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

            const data = await (await fetch(`https://owlracle.info/keys/${input.value.toLowerCase()}`)).json();
            if (data.error && data.status == 401){
                this.showTip('Could not find your api key');
                return;
            }

            cookies.set('logged', true, { json: true });
            cookies.set('apikey', data.apiKey, { json: true });
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
        console.log('new key');
    }
}

export default api;