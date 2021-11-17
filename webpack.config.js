const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const StylelintPlugin = require('stylelint-webpack-plugin');

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all',
    },
  };

  if (!IS_DEVELOPMENT) {
    config.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }

  return config;
};

const filename = ext => IS_DEVELOPMENT ? `[name].${ext}` : `[name].[hash].${ext}`;

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: IS_DEVELOPMENT,
        reloadAll: true,
      },
    },
    'css-loader',
  ];

  if (extra) {
    loaders.push(extra);
  }

  return loaders;
};

const babelOptions = preset => {
  const opts = {
    presets: [
      '@babel/preset-env',
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
    ],
  };

  if (preset) {
    opts.presets.push(preset);
  }

  return opts;
};


const jsLoaders = () => {
  const loaders = [{
    loader: 'babel-loader',
    options: babelOptions(),
  }];

  if (IS_DEVELOPMENT) {
    loaders.push('eslint-loader');
  }

  return loaders;
};

const pages = [
  'about',
  'advices',
  'contacts',
  'download',
  'fulladvices',
  'fullnews',
  'index',
  'lk',
  'news',
];

const pagesList = pages.map(name => {
  return new HTMLWebpackPlugin({
    template: `./${name}.html`,
    filename: `${name}.html`,
    chunks: [`${name}`],
    minify: {
      collapseWhitespace: !IS_DEVELOPMENT,
    },
  });
});

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({
      template: './index.html',
      minify: {
        collapseWhitespace: !IS_DEVELOPMENT,
      },
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
        {
            from: './assets/images',
            to: './assets/images',
        },
    ]),
    new MiniCssExtractPlugin({
      filename: filename('css'),
    }),
    new StylelintPlugin(),
  ].concat(pagesList);

  if (!IS_DEVELOPMENT) {
    base.push(new BundleAnalyzerPlugin());
  }

  return base;
};

const entriesList = {};

pages.map((page) => {
  return page === 'index'
    ? entriesList.main = ['@babel/polyfill', `./index.js`]
    : entriesList[page] = ['@babel/polyfill', `./js/entry/${page}.js`];
});

console.log(entriesList);

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: entriesList,
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimization: optimization(),
  devServer: {
    port: 4200,
    hot: IS_DEVELOPMENT,
  },
  devtool: IS_DEVELOPMENT ? 'source-map' : '',
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: cssLoaders(),
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders('sass-loader'),
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        use: ['file-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders(),
      },
    ],
  },
};