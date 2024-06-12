const path = require('path');

module.exports = {
    entry: './views/js/app.js', // Entry point of your frontend JavaScript/TypeScript
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js' // Output bundle file
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'] // Add .js, .ts, and .tsx as resolved extensions
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader' // For JavaScript files
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader' // For TypeScript files
            }
        ]
    },
    // Other webpack configurations...
};