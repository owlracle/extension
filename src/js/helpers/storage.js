// set the cookie utils object
export default {
    set: async function(key, value) {
        const settings = {};
        settings[key] = value;
        await chrome.storage.local.set(settings); 
    },

    get: async function (key) {
        const obj = await chrome.storage.local.get(key);
        if (!Object.keys(obj).length) {
            return false;
        }

        return obj[key];
    },

    delete: async function(key) {
        if (!(await this.get(key))) {
            return false;
        }

        await chrome.storage.local.remove(key);
        return true;
    },
};