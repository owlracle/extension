// modal window
export default class ModalWindow {
    constructor({ title, message, className, buttons }) {
        const fog = document.createElement('div');
        fog.id = 'fog';

        if (className) {
            fog.classList.add(className);
        }

        if (!buttons){
            buttons = { 'OK': () => {}};
        }

        fog.innerHTML = `<div class="modal">
                <h2>${title}</h2>
                <div id="content">${message}</div>
                <div id="button-container">
                    ${Object.keys(buttons).map(b => `<button>${b}</button>`).join('')}
                </div>
            </div>`;
        document.body.appendChild(fog);
        fog.addEventListener('click', () => fog.remove());
        fog.querySelector('.modal').addEventListener('click', e => e.stopPropagation());
        
        fog.querySelectorAll('#button-container button').forEach((b,i) => {
            b.addEventListener('click', () => {
                Object.values(buttons)[i](fog);
                fog.remove();
            });
        });

        return this;
    }
}