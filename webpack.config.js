const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TemplateBannerPlugin = require('template-banner-webpack-plugin');

const babelConfig = {
    cacheDirectory: true,
    presets: [
        ['env', {
            'modules': false,
            'targets': {
                'browsers': ['> 2%'],
                uglify: true
            },
        }]
    ],
    plugins: [
        'transform-object-rest-spread',
        ['transform-runtime', {
            'polyfill': false,
            'helpers': false
        }]
    ]
};

let config = {
    entry: path.resolve(__dirname + '/src/Autocomplete.js'),
    output: {
        path: path.resolve(__dirname + '/dist'),
        library: 'Autocomplete',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: 'Autocomplete.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname + '/src'),
                exclude: /node_modules/,
                // use: [{loader: 'babel-loader', options: babelConfig}]
            },
        ]
    },
    resolve: {
        extensions: [".js"],
    },
    plugins: [
        new UglifyJsPlugin(),
        new TemplateBannerPlugin({
            banner: `{name} v{version}
(c) {year} {author}
Released under the {license} License.`,
            default: {
                year: (new Date()).getFullYear(),
            },
        }),
    ]
};


module.exports = config;