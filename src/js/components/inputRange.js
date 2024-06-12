export default class InputRange {

    disabled = false;

    constructor (elem) {
        const size = Array.from(document.querySelectorAll('.range-custom')).length;
        elem.id = `input-range-${size}`;
        elem.insertAdjacentHTML('afterend', `
            <div id="range-custom-${size}" class="range-custom">
                <div class="bar">
                    <div class="filled"></div>
                    <div class="thumb"></div>
                </div>
            </div>
        `);
        elem.setAttribute('hidden', true);

        const range = document.querySelector(`#range-custom-${size}`);
        const thumb = range.querySelector(`.thumb`);
        const filled = range.querySelector(`.filled`);

        const moveRange = (e, ignoreButton) => {
            if (this.disabled) return;

            // enter when clicking or dragging
            console.log(e, range.getBoundingClientRect());
            if (e && e.buttons === 1 || ignoreButton) {
                const pos = (e.clientX - range.getBoundingClientRect().left) / range.offsetWidth;
                elem.value = (parseInt(elem.max) - parseInt(elem.min)) * pos + parseInt(elem.min);
                this.value = elem.value;
            }

            // enter normally, or at the start (!e)
            if (!e || (e.buttons === 1 || ignoreButton)) {
                thumb.innerHTML = elem.value;
                // recalc after setting value, because input step
                const newPos = (elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 100;
                filled.style['width'] = `${ newPos }%`;
        
                const r = 200 - ((elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 97);
                const g = (elem.value - parseInt(elem.min)) / (parseInt(elem.max) - parseInt(elem.min)) * 71 + 90;
                filled.style['background-color'] = `rgb(${r},${g},64)`;
            }

            if (this.changeEvent) {
                this.value = elem.value;
                this.changeEvent(elem.value);
            }

        };
        moveRange();
        range.addEventListener('mousemove', e => moveRange(e));
        range.addEventListener('click', e => moveRange(e, true));
    }

    change(callback) {
        this.changeEvent = callback;
        return this;
    }

    disable() {
        this.disabled = true;
    }
}
