const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: 'javascripts/alt-index.js',
  output: {
    path: path.resolve(__dirname, 'client/dist'),
    filename: 'bundle.js',

    publicPath: '/',
  },

  resolve: {
    root: path.resolve(__dirname, 'client/'),
  },
};
