const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pages = [
  { filename: 'index.html', template: './src/index.html' },
  { filename: 'nnp-arena.html', entry: './src/nnp-arena.js' },
  { filename: 'nnp-datasets.html', entry: './src/nnp-datasets.js' },
  { filename: 'nnp-architectures.html', entry: './src/nnp-architectures.js' },
];

const htmlPlugins = pages.map(page => new HtmlWebpackPlugin({
  template: page.template || `./src/${page.filename}`, // Use the specified template or fallback
  filename: page.filename,
  chunks: page.entry ? [path.basename(page.entry, '.js')] : [], // Include JS chunks if they exist
}));

module.exports = {
  entry: {
    "nnp-arena": './src/nnp-arena.js',
    "nnp-datasets": './src/nnp-datasets.js',
    "nnp-architectures": './src/nnp-architectures.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: '[name].bundle.js', // Output filename pattern
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Handle JS and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.csv$/,
        use: 'csv-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Resolve these extensions
  },
  plugins: [
    ...htmlPlugins, // Add HTML plugins for each page
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'), // Serve static files from dist
    },
    compress: true,
    port: 8080,
    historyApiFallback: true, // Redirect all 404s to index.html
  },
};
