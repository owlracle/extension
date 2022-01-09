import { cookies, ModalWindow, menu } from './utils.js';

const api = {
    check: function() {
        const logged = cookies.get('logged');
        if (!logged){
            this.showWelcome();
            return false;
        }
        else {
            cookies.refresh('logged');
            // TODO: if is logged
        }
    },

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

        });

        // create new api key
        container.querySelector('#new').addEventListener('click', () => {

        });
    }
}

export default api;