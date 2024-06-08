import storage from "./storage.js";
import menu from "../components/menu.js";
import advisor from "../advisor.js";


export default {
    set: async function(args) {
        const login = (await storage.get('login')) || {};

        Object.entries(args).forEach(([k,v]) => login[k] = v);

        storage.set('login', login);

        if (login.apikey) {
            advisor.set({ apiKey: login.apikey });
            menu.enable('advisor');
        }
    },

    refresh: function() {
        this.set({});
    },

    get: async function(field){
        const login = await storage.get('login');

        if (!login){
            return false;
        }
        if (!field){
            return login;
        }
        if (!login[field]){
            return false;
        }
        return login[field];
    },

    delete: async function(fields){
        if (!Array.isArray(fields)){
            fields = [fields];
        }

        const login = await storage.get('login', true);

        fields.forEach(f => {
            if (login && login[f]){
                delete login[f];
            }
        });

        storage.set('login', login);

        if (fields.includes('apikey')) {
            advisor.set({ apiKey: false });
            menu.disable('advisor');
        }
    }
}