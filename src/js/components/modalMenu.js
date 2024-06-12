// modal menu class
export default class ModalMenu {

    constructor(itemList, { customClass }={}) {
        const modalMenu = document.createElement('div');
        modalMenu.id = 'modal-menu';

        if (customClass) {
            modalMenu.classList.add(customClass);
        }

        const fog = document.createElement('div');
        fog.id = 'fog';
        fog.classList.add('invisible');

        document.body.appendChild(fog);
        fog.appendChild(modalMenu);

        fog.addEventListener('click', () => fog.remove());

        itemList.forEach(e => {
            const item = this.addItem(e);
            modalMenu.appendChild(item);
        });
    }

    addItem(item) {
        const itemDOM = document.createElement('div');
        itemDOM.classList.add('item');

        if (item.id) {
            itemDOM.id = item.id;
        }

        if (item.customClass) {
            itemDOM.classList.add(item.customClass);
        }

        let html = '';

        if (item.image) {
            html += `<img class="icon" src="${item.image}" alt="${item.text} icon">`;
        }

        if (item.icon) {
            html += `<i class="icon ${item.icon}"></i>`;
        }

        if (item.text) {
            html += `<span class="name">${item.text}</span>`;
        }

        itemDOM.innerHTML = html;

        if (item.action) {
            itemDOM.addEventListener('click', () => item.action(item, itemDOM));
        }

        return itemDOM;
    }
}