// dropdown class
export default class Dropdown {
    constructor({ button, itemList, position, clickFn }) {
        button.addEventListener('click', function () {
            const dropdown = document.createElement('div');
            dropdown.id = 'dropdown';

            itemList.forEach(e => {
                const item = document.createElement('div');
                item.classList.add('item');

                item.innerHTML = e.innerHTML;

                Object.entries(e).forEach(([k, v]) => {
                    if (k != 'innerHTML') {
                        item.setAttribute(k, v);
                    }
                });
                dropdown.appendChild(item);
            });

            // if (!position) {
            //     position = { top: 0, left: 0 };
            // }
            // dropdown.style.top = `${this.offsetTop + this.clientHeight + position.top}px`;
            // dropdown.style.left = `${this.offsetLeft + position.left}px`;

            const fog = document.createElement('div');
            fog.id = 'fog';
            fog.classList.add('invisible');

            document.body.appendChild(fog);
            fog.appendChild(dropdown);

            fog.addEventListener('click', () => fog.remove());

            const items = dropdown.querySelectorAll('.item');
            items.forEach(b => b.addEventListener('click', () => clickFn(b)));

            return this;
        });
    }
}