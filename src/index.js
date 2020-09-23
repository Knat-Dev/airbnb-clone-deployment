'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const apollo_server_express_1 = require('apollo-server-express');
const express_1 = __importDefault(require('express'));
const mongoose_1 = __importDefault(require('mongoose'));
mongoose_1.default.set('useFindAndModify', false);
const index_1 = require('./graphql/index');
const cookie_parser_1 = __importDefault(require('cookie-parser'));
const compression_1 = __importDefault(require('compression'));
const port = process.env.PORT || 8080;
const app = express_1.default();
app.use(compression_1.default());
app.use(cookie_parser_1.default(process.env.SECRET));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.static(`${__dirname}/client`));
app.get('/*', (_req, res) => {
    res.sendFile(`${__dirname}/client/index.html`);
});
const server = new apollo_server_express_1.ApolloServer({
    typeDefs: index_1.typeDefs,
    resolvers: index_1.resolvers,
    context: ({ req, res }) => ({ req, res }),
});
server.applyMiddleware({ app, path: '/api' });
mongoose_1.default
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iz9mu.mongodb.net/airbnb-clone?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
        console.log('MongoDB Connected successfully...');
        app.listen(port, () => {
            console.log(
                `[app-${new Date().toISOString()}]: Express Server is running on port ${port}`
            );
        });
    });
