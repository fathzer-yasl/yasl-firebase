const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './web/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'web/dist'),
    clean: true,
  },
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      inject: 'body',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'web/js'), 'node_modules'],
  },
};
