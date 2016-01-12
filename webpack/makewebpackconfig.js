/* eslint-disable */

// Important modules this config uses
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var AppCachePlugin = require('appcache-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

// PostCSS plugins
var cssnext = require('postcss-cssnext');
var postcssFocus = require('postcss-focus');
var autoprefixer = require('autoprefixer');
var postcssReporter = require('postcss-reporter');
var cssnano = require('cssnano');

// Browser we want to support in our CSS
var browsers = ['last 2 versions', 'IE > 10'];

module.exports = function(options) {
  // The things we'll change depending on the environment
  var entry, jsLoaders, plugins, cssLoaders, query, postcssPlugins;

  /*
   * DEVELOPMENT
   */
  if (options.prod === false) {
    // Add hot reloading in development
    entry = [
      "webpack-dev-server/client?http://localhost:3000", // Needed for hot reloading
      "webpack/hot/only-dev-server", // See above
      path.join(__dirname, '..', 'app/app.js') // Start with js/app.js...
    ];
    // Load the CSS in a style tag
    cssLoaders = 'style-loader!css-loader?modules&importLoaders=1&sourceMap!postcss-loader';
    // Process the CSS with PostCSS
    postcssPlugins = [
      postcssFocus(), // Add a :focus to every :hover
      cssnext({ // Allow future CSS features to be used, also auto-prefixes the CSS...
        browsers: browsers // ...based on this browser list
      }),
      postcssReporter({ // Posts messages from plugins to the terminal
        clearMessages: true
      })
    ];
    // Add hot reloading
    plugins = [
      new webpack.HotModuleReplacementPlugin(), // Tell webpack we want to hot reload
      new HtmlWebpackPlugin({
        template: 'app/index.html', // Move the index.html file
        inject: true // inject all files that are generated by webpack, e.g. bundle.js, main.css with the correct HTML tags
      })
    ]
    // Tell babel that we want to hot-reload
    query = {
      plugins: [
        ["react-transform", {
          transforms: [{
            transform: "react-transform-hmr",
            imports: ["react"],
            locals: ["module"]
          }]
        }]
      ]
    }
  /*
   * PRODUCTION
   */
  } else {
    // In production, we skip all hot-reloading stuff
    entry = [
      path.join(__dirname, '..', 'app/app.js')
    ];
    // We use ExtractTextPlugin so we get a seperate CSS file instead
    // of the CSS being in the big JS file
    cssLoaders = ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=1!postcss-loader');
    // In production, we minify our CSS with cssnano too
    postcssPlugins = [
      postcssFocus(),
      cssnext({
        browsers: browsers
      }),
      cssnano({
        autoprefixer: false, // cssnext already runs autoprefixer
        discardUnused: false, // unsafe, see http://mxs.is/googmr
        zindex: false // unsafe, see http://mxs.is/googmq
      }),
      postcssReporter({
        clearMessages: true
      })
    ];
    plugins = [
      // Minify and optimize the JavaScript
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false // ...but do not show warnings in the console (there is a lot of them)
        }
      }),
      // Minify and optimize the index.html
      new HtmlWebpackPlugin({
        template: 'app/index.html',
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        },
        inject: true
      }),
      // Extract the CSS into a seperate file
      new ExtractTextPlugin("css/main.css"),
      // Set the process.env to production so React includes the production
      // version of itself
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify("production")
        }
      })
    ];
  }

  plugins.push(new AppCachePlugin({ // AppCache should be everywhere
    exclude: ['.htaccess'] // No need to cache .htaccess. See http://mxs.is/googmp
  }));

  return {
    entry: entry,
    output: { // Compile into js/build.js
      path: path.resolve(__dirname, '..', 'build'),
      filename: "js/bundle.js"
    },
    module: {
      loaders: [{
          test: /\.js$/, // Transform all .js files required somewhere within an entry point...
          loader: 'babel', // ...with the specified loaders...
          exclude: path.join(__dirname, '..', '/node_modules/'), // ...except for the node_modules folder.
          query: query,
        }, {
          test:   /\.css$/, // Transform all .css files required somewhere within an entry point...
          loader: cssLoaders // ...with PostCSS
        }, {
          test: /\.jpe?g$|\.gif$|\.png$/i,
          loader: "url-loader?limit=10000"
        },
        {
          test: /\.html$/,
          loader: 'html-loader'
        }
      ]
    },
    plugins: plugins,
    postcss: function() {
      return postcssPlugins;
    },
    target: "web", // Make web variables accessible to webpack, e.g. window
    stats: false, // Don't show stats in the console
    progress: true
  }
}