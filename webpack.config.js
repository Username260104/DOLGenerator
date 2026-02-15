const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('inline-chunk-html-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

module.exports = (env, argv) => ({
  mode: 'production',
  devtool: 'inline-source-map',

  entry: {
    ui: './ui.tsx',
    code: './code.ts',
  },

  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', { loader: 'css-loader' }] },
      { test: /\.(png|jpg|gif|webp|svg)$/, loader: 'url-loader' },
    ],
  },

  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  optimization: {
    minimize: false,
  },

  plugins: [
    // .env 파일의 환경변수를 빌드 시 주입
    new Dotenv(),

    new HtmlWebpackPlugin({
      template: './ui.html',
      filename: 'ui.html',
      inject: 'body',
      chunks: ['ui'],
      cache: false,
    }),

    // 청크를 HTML 파일에 인라인
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
  ],
});
