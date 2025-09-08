const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    popup: './popup/popup.tsx',
    background: './background/background.ts',
    content: './content/content.ts',
    'content-simple': './content/content-simple.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'lib'),
      '@app': path.resolve(__dirname, 'app')
    },
    fallback: {
      "process": require.resolve("process/browser"),
      "buffer": require.resolve("buffer"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "url": require.resolve("url"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "net": false,
      "tls": false
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.BROWSER': JSON.stringify(true)
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
        { from: 'public', to: 'public' },
        { from: 'popup/popup.html', to: 'popup.html' },
        { from: 'popup/popup.css', to: 'popup.css' }
      ]
    })
  ],
  devtool: 'source-map'
};
