const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

function generateHtmlPlugins(templateDir) {
	const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir))
	return templateFiles.map(item => {
		const parts = item.split('.')
		const name = parts[0]
		const extension = parts[1]

		return new HtmlWebpackPlugin({
			filename: `${name}.html`,
			template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
			minify: false
		})
	})
}

const htmlPlugins = generateHtmlPlugins('./src/pug/pages')

module.exports = {
	context: path.resolve(__dirname, 'src'),
	entry: './js/index.js',
	output: {
		filename: 'js/scripts.min.js',
		path: path.resolve(__dirname, 'dist')
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.js$/,
				// include: path.resolve(__dirname, 'src/js'),
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{
									targets: {
										browsers: '> 0.5%, IE 11, not dead',
									},
								}
							]
						]
					}
				}
			},
			{
				test: /\.(sa|sc|c)ss$/i,
				use: [
					{
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
            },
          },
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							plugins: [
								autoprefixer()
							],
							sourceMap: true
						}
					},
					'sass-loader',
				],
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'images'
				}
			},
			{
				test: /\.(ttf|woff|woff2|eot|otf)$/i,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'fonts'
				}
			},
			{
				test: /\.pug$/,
				loader: 'pug-loader'
			}
		]
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: 'images',
					to: 'images',
					noErrorOnMissing: true
				},
			],
		}),
		new MiniCssExtractPlugin({
			filename: 'css/style.min.css'
		}),
		new CleanWebpackPlugin(),
	].concat(htmlPlugins)
}