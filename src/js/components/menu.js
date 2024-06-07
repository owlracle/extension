import storage from "../helpers/storage.js";

// footer menu
export default {
    active: 'gas',

    // set function for switching between menu buttons
    init: async function() {
        document.querySelectorAll('#menu .item').forEach(e => e.addEventListener('click', () => this.setActive(e.id)));

        // try to load menu cookie
        const menuCk = await storage.get('menu');
        if (menuCk){
            try {
                this.active = menuCk;
            }
            catch (error){
                console.log(error);
                storage.delete('menu');
            }
        }
    },

    // change dom css
    setActive: function(active) {
        if (this.isDisabled(active)){
            return;
        }

        this.active = active;

        document.querySelectorAll('#menu .item, #content .item').forEach(e => {
            e.classList.remove('active');
        });

        document.querySelector(`#content #${active}.item`).classList.add('active');
        document.querySelector(`#menu #${active}.item`).classList.add('active');

        // set cookie
        storage.set('menu', this.active);
    },

    getActive: function() {
        return this.active;
    },

    setClick: function(active, fn) {
        document.querySelector(`#menu #${active}.item`).addEventListener('click', () => {
            if (!this.isDisabled(active)){
                fn();
            }
        });
    },

    click: function(active) {
        document.querySelector(`#menu #${active || this.active}.item`).click();
    },

    hide: function() {
        document.querySelectorAll('#header, #menu').forEach(e => e.classList.add('hidden'));
        return this;
    },
    
    show: function() {
        document.querySelectorAll('#header, #menu').forEach(e => e.classList.remove('hidden'));
        return this;
    },

    disable: function(active) {
        document.querySelector(`#menu #${active}.item`).classList.add('disabled');
    },

    isDisabled: function(active) {
        return document.querySelector(`#menu #${active}.item`).classList.contains('disabled');
    },

    enable: function(active) {
        document.querySelector(`#menu #${active}.item`).classList.remove('disabled');
    },
}