const webpack = require("webpack");
const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TransferWebpackPlugin = require("transfer-webpack-plugin");
const autoprefixer = require('autoprefixer');
const portfinder = require('portfinder');
const fs = require('fs');

//////////////////////访问端口//////////////////////
var ports = fs.readFileSync('./port.json', 'utf-8');
ports = JSON.parse(ports);
portfinder.basePort = "8080",
portfinder.getPort(function(err, port){
	ports.data.port = port;
	ports = JSON.stringify(ports, null, 4);
	fs.writeFileSync('./port.json', ports);
});

//////////////////////自动获取本机ip//////////////////////////////
let os = require('os');
function getIp(){
	let interfaces = os.networkInterfaces();
	for(let devName in interfaces){
		let iface = interfaces[devName];
		for(let i = 0; i < iface.length; i++){
			let alias = iface[i];
			if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
				return alias.address;
			}
		}
	}
}
let host = getIp();

//////////////////////动态添加入口方法/////////////////////////////
function getEntry(){
	var entry = {};
	glob.sync('./src/entry/**/*.js').forEach(function(name){
		let start = name.indexOf('src/') + 4;
		let end = name.length - 3;
		let arr = [];
		let n = name.slice(start, end);
		n = n.split('/')[1];
		arr.push(name);
		arr.push('@babel/polyfill');
		entry[n] = arr;
	})
	return entry;
}

//////////////////////动态生成html//////////////////////
let getHtmlConfig = function(name, chunks){
	return {
		template: `./src/pages/${name}.html`,
		filename: `pages/${name}.html`,
		inject: true,
		hash: false,
		chunks: [name]
	}
}

module.exports = {
	entry: getEntry(),
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'js/[name]-bundle.js'
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'dist'),
		historyApiFallback: false,
		hot: true,
		inline: true,
		stats: 'errors-only',
		host: host,
		port: ports.data.port,
		overlay: true,
		open: true
	},
	module:{
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				include: /src/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
							plugins: ['@babel/transform-runtime']
						}
					}
				]
			},
			{
				test: /\.css$/,
				use: ['style-loader','css-loader', 'postcss-loader']
				// use: [MiniCssExtractPlugin.loader, "css-loader", {
				// 	loader: "postcss-loader",
				// 	options: {
				// 		plugins:{
				// 			autoprefixer({
				// 				browsers: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6']
				// 			})
				// 		}
				// 	}
				// }]
			},
			{
				test: /\.scss$/,
				use: ['style-loader','css-loader','sass-loader','postcss-loader']
				// use: [MiniCssExtractPlugin.loader, "css-loader", {
				// 	loader: "postcss-loader",
				// 	options: {
				// 		plugins: {
				// 			autoprefixer({
				// 				browsers: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6']
				// 			})
				// 		}
				// 	}
				// }, "sass-loader"]
			},
			{
				test: /\.(png|jpg|gif|jpeg)$/,
				use:[
					{
						loader: 'url-loader',
						options:{
							limit: 5000
						}
					}
				]
			}
		]
	},
	mode: "development",
	performance:{
		hints: false
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "css/[name].css"
		}),
		new webpack.ProvidePlugin({
			$: "jquery",
			jquery: "jquery",
			jQuery: 'jquery',
			"window.jQuery": "jquery"
		}),
		new TransferWebpackPlugin([
			{
				from: 'assets',
				to: 'assets'
			}
		], path.resolve(__dirname, "src")),
		new webpack.HotModuleReplacementPlugin()
	]
}

let entryObj = getEntry();
let htmlArray = [];
Object.keys(entryObj).forEach((element) => {
	htmlArray.push({
		_html: element,
		title: '',
		chunks: [element]
	})
})

htmlArray.forEach((element) => {
	module.exports.plugins.push(new HtmlWebpackPlugin(getHtmlConfig(element._html, element.chunks)));
})

