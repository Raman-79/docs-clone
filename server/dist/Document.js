"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Document = new mongoose_1.Schema({
    _id: {
        type: String,
    },
    data: Object,
});
exports.default = (0, mongoose_1.model)("Document", Document);
