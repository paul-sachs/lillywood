var webpack = require('webpack');
var path = require('path');

module.exports = {
    resolve: {
        root: [
            path.resolve('./src'),
            path.resolve('.')
        ]
    }
};
