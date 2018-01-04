 var path = require('path');
 var webpack = require('webpack');

 var clientConfig = {
     target: 'web', // <=== can be omitted as default is 'web'
     entry: './client/main.js',
     output: {
         path: path.resolve(__dirname, 'build'),
         filename: 'client.bundle.js'
     },
     module: {
         loaders: [
             {
                 test: /\.js$/,
                 loader: 'babel-loader',
                 query: {
                     presets: ['env']
                 }
             },
             {
                 test: /\.scss$/,
                 loaders: ['style-loader', 'css-loader', 'sass-loader']
             }
         ]
     },
     stats: {
         colors: true
     },
     devtool: 'source-map'
 };

 module.exports = [clientConfig ];
