 var path = require('path');
 var webpack = require('webpack');
 var serverConfig = {
     target: 'node',
     entry: './src/main.js',
     output: {
         path: path.resolve(__dirname, 'build'),
         filename: '[name].bundle.js'
     },
     module: {
         loaders: [
             {
                 test: /\.js$/,
                 loader: 'babel-loader',
                 query: {
                     presets: ['env']
                 }
             }
         ]
     },
     stats: {
         colors: true
     },
     devtool: 'source-map'
 };

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

 module.exports = [ serverConfig, clientConfig ];
 // module.exports = {
 //     entry: {
 //         main: './src/main.js',
 //         client: './client/main.js'
 //     },
 //     target: 'node',
 //     output: {
 //         path: path.resolve(__dirname, 'build'),
 //         filename: '[name].bundle.js'
 //     },
 //     module: {
 //         loaders: [
 //             {
 //                 test: /\.js$/,
 //                 loader: 'babel-loader',
 //                 query: {
 //                     presets: ['env']
 //                 }
 //             }
 //         ]
 //     },
 //     stats: {
 //         colors: true
 //     },
 //     devtool: 'source-map'
 // };
