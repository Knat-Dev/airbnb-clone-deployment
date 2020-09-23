"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client = new stripe_1.default(`${process.env.S_SECRET_KEY}`, {
    typescript: true,
    apiVersion: '2020-08-27',
});
exports.Stripe = {
    connect: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield client.oauth.token({
            code,
            grant_type: 'authorization_code',
        });
        return response;
    }),
    disconnect: (stripeUserId) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield client.oauth.deauthorize({
            client_id: `${process.env.S_CLIENT_ID}`,
            stripe_user_id: stripeUserId,
        });
    }),
    charge: ({ amount, currency = 'usd', stripeAccount, source, }) => __awaiter(void 0, void 0, void 0, function* () {
        const appFee = Math.round(0.05 * amount);
        const withStripePrice = Math.round((amount + appFee + 30) / (1 - 0.029));
        console.log(withStripePrice);
        const charge = yield client.charges.create({
            amount: withStripePrice,
            currency,
            application_fee_amount: appFee,
            source,
        }, {
            stripeAccount,
        });
        if (charge.status !== 'succeeded') {
            throw new Error('Failed to create charge with Stripe.');
        }
    }),
};
