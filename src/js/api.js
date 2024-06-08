import Request from './helpers/request.js';
import ModalWindow from './components/modal.js';
import menu from './components/menu.js';
import login from './helpers/login.js';

const api = {

    website: 'https://owlracle.info',

    footer: `
        <a class="item" href="https://github.com/owlracle" target="_blank"><i class="fa-brands fa-github"></i></a>
        <a class="item" href="https://discord.gg/zYS4f8eRbC" target="_blank"><i class="fa-brands fa-discord"></i></a>
        <a class="item" href="https://t.me/owlracle" target="_blank"><i class="fa-brands fa-telegram"></i></a>
        <a class="item" href="https://twitter.com/0xowlracle" target="_blank"><i class="fa-brands fa-twitter"></i></a>
        <a class="item" href="https://medium.com/@owlracleapi" target="_blank"><i class="fa-brands fa-medium"></i></a>
    `,

    check: async function() {
        const lg = await login.get('logged');
        if (!lg){
            this.showWelcome();
            return false;
        }

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
                <a href="${this.website}" target="_blank"><img id="logo" src="${this.website}/img/owl.webp"></a>
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
                        login.set({ logged: true });
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
        const apiKey = await login.get('apikey');

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

        const data = await new Request().get(`keys/${ apiKey }`);
        if (data.error){
            new ModalWindow({
                title: 'Session expired',
                message: 'Your session has expired. Please log in again with your api key.'
            });

            login.delete(['apikey', 'logged']);
            menu.click('key');
            return;
        }

        container.classList.remove('loading');
        container.innerHTML = `
            <div id="content" class="logged key-info">
                <div class="row">
                    <span>Api Key</span>
                    <span>Credit</span>
                </div>
                <div class="row">
                    <input class="input" value="${data.apiKey.slice(0,4)}...${data.apiKey.slice(-4)}" readonly>
                    <input class="input" value="$${parseFloat(data.credit).toFixed(4)}" readonly>
                </div>
                <div class="row">
                    <span>Usage 1h</span>
                    <span>Usage Total</span>
                </div>
                <div class="row">
                    <input class="input" value="${data.usage.apiKeyHour}" readonly>
                    <input class="input" value="${data.usage.apiKeyTotal}" readonly>
                </div>
                <button id="logout"><i class="fa-solid fa-right-from-bracket"></i>LOGOUT</button>
                <a href="${ this.website }/?action=keys&apikey=${data.apiKey}" target="_blank">Visit ${this.website} for more information</a>
                <a id="policies">Check our privacy and permission policies</a>
            </div>
            <div id="footer" class="logged">${this.footer}</div>
        `;

        container.querySelector('#logout').addEventListener('click', () => {
            login.delete(['apikey', 'logged']);
            menu.click('key');
        });

        container.querySelector('#policies').addEventListener('click', () => {
            new ModalWindow({
                title: 'Our policies',
                className: 'policies',
                message: `
                    <p><b>We do not collect nor store any of your personal data.</b></p>
                    <p>The extension store your preferences such as chosen network and last tab on <b>local storage. None of this is transmitted to our server.</b></p>
                    <p>The extension also stores your logged <b>API key on local storage</b>. You use it every time you ask for gas information from our servers.</p>
                    <p>When using the Tx Advisor, the extension has access to the <b>active tab</b>, just as Metamask, AdBlock, and many other extensions do.</p>
                    <p>To do its thing, Tx Advisor needs to have access to a global variable set and read by Metamask (<i>window.ethereum</i>). This is the only reason for the active tab permission. <b>No other info about your tab is used or recorded.</b></p>
                    <p>Our code is <b>open-source</b>. You can always check it <a href="https://github.com/owlracle/extension" target="_blank">here</a>, or <a href="https://discord.gg/bHckPMw3Qu" target="_blank">ask us anything</a>.</p>
                `,
                buttons: {
                    'I understand': () => {},
                }
            })
        })
    },

    showGuestInfo: async function() {
        const logged = await login.get('logged');

        const container = document.querySelector('#content #key');
        container.innerHTML = `<div id="content" class="logged">
            <span>${ logged ? `Log in with an api key to increase your request limit` : `Log in using your api key` }</span>
            <input class="input" placeholder="YOUR_API_KEY">
            <span id="tip"></span>
            <button id="login"><i class="fa-solid fa-right-to-bracket"></i>LOG IN</button>
            ${ logged ? `
                <span class="small">or</span>
                <a>Create New Api Key</a>
            ` : `
                <button id="back"><i class="fa-solid fa-arrow-left"></i>BACK</button>
            `}
        </div>`;
        
        const input = container.querySelector('.input');
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
            const data = await new Request().get(`keys/${input.value.toLowerCase()}`);
            button.innerHTML = text;
            if (data.error && data.status == 401){
                this.showTip('Could not find your api key');
                return;
            }

            // do not expire cookie after broser close
            const opt = {
                logged: true,
                apikey: data.apiKey
            };

            login.set(opt);

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
        window.open(`${ this.website }/?action=newkey`);
    }
}

export default api;