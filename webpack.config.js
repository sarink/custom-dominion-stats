const webpack = require('webpack');
const path = require('path');

const FlowStatusWebpackPlugin = require('flow-status-webpack-plugin');

const dotCssLoaders = [
  'style?sourceMap',
  'css?modules',
];

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: 'javascripts/index',
  output: {
    path: path.resolve(__dirname, 'client/dist'),
    filename: 'bundle.js',

    publicPath: 'dist/',
  },

  module: {
    loaders: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'stage-0'],
        },
      },
      {
        test: /\.css/,
        exclude: /node_modules/,
        loaders: dotCssLoaders,
      },
      {
        test: /\.scss/,
        exclude: /node_modules/,
        loaders: [].concat(dotCssLoaders).concat(['sass']),
      },
    ],
  },

  resolve: {
    root: path.resolve(__dirname, 'client/'),
    extensions: ['', '.js', '.jsx'],
  },

  plugins: [
    new FlowStatusWebpackPlugin(),
  ],
};
