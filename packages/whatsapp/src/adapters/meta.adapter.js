"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaAdapter = void 0;
class MetaAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendText(_to, _text) {
        throw new Error("MetaAdapter not implemented — use for production after Meta verification");
    }
    async sendDocument(_to, _url, _filename) {
        throw new Error("MetaAdapter not implemented");
    }
    async sendLocation(_to, _lat, _lng, _name) {
        throw new Error("MetaAdapter not implemented");
    }
    async sendButtons(_to, _text, _buttons) {
        throw new Error("MetaAdapter not implemented");
    }
    parseWebhook(_payload) {
        throw new Error("MetaAdapter not implemented");
    }
}
exports.MetaAdapter = MetaAdapter;
//# sourceMappingURL=meta.adapter.js.map