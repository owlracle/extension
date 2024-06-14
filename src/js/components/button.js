export default class Button {

    domElement = null;

    constructor (text = '') {
        this.domElement = document.createElement('button');
        this.domElement.innerHTML = text;
    }

    click (callback) {
        this.domElement.addEventListener('click', callback);
        return this;
    }

    append (container) {
        container.appendChild(this.domElement);
        return this;
    }

    setText (text) {
        this.domElement.innerHTML = text;
        return this;
    }
}