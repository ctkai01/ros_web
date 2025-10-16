const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: isProduction ? '/' : '/',
      clean: true
    },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'file-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: ['all'],
      proxy: [
        {
          context: ['/api'],
          target: 'http://ntu-amr-1.local:3000',
          changeOrigin: true,
          secure: false,
        }
      ],
      client: {
        webSocketURL: {
          hostname: 'ntu-amr-1.local',
          port: 8080,
        }
      },
      hot: true,
      historyApiFallback: true,
      devMiddleware: {
        publicPath: '/'
      }
    },
  };
}; 