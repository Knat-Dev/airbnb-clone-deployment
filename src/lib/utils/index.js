"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const models_1 = require("../../models");
exports.authorize = (req) => {
    const token = req.get('X-CSRF-TOKEN') || '3fc913d50e734969ca7303f400ec2dda';
    if (!token)
        throw new Error('no token');
    return models_1.User.findOne({ _id: req.signedCookies.viewer, token }).then((user) => user);
};
