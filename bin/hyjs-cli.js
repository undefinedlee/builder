#!/usr/bin/env node

var program = require('commander'),
	package = require("../package.json"),
	fs = require("fs"),
	path = require("path");

program
	.version(package.version)
	.option("--save", "save module to dependencies");

// 项目配置
program
	.command("config <key> [value]")
	.description("config project")
	.action(function(key, value){
		var configMod = require("../config/config");
		var config = configMod();

		key = key.split(".");
		var _config = config;
		while(key.length > 1){
			_config = _config[key.shift()];
		}
		key = key[0];

		if(value === "true"){
			value = true;
		}else if(value === "false"){
			value = false;
		}

		if(typeof value !== "undefined"){
			_config[key] = value;
			configMod.set(config);
		}else{
			console.log(_config[key]);
		}
	});
// 切换环境
program
	.command("env [env]")
	.description("set env")
	.action(function(env){
		var configMod = require("../config/config");
		var config = configMod();

		if(env){
			if(env === "tpl"){
				console.error("env can not is tpl");
				return;
			}
			config.env = env;
			configMod.set(config);
		}else{
			console.log(config.env);
		}
	});

// 初始化一个项目
program
	.command('init [path]')
	.description('init one planejs project')
	.action(function(path){
		//console.log("init");
		require("../command/init.js")(path);
	});

// 启动一个静态服务
program
	.command('server [port]')
	.description('start server')
	.action(function(port){
		require("../command/server.js")(port);
	});

// 构建项目
program
	.command('build [path]')
	.description('build project')
	.action(function(path){
		require("../command/build.js")(path);
	});

// 安装一个模块
program
	.command('install [moduleName]')
	.description('install a module')
	.action(function(moduleName){
		if(moduleName){
			console.log("install " + moduleName);
			if(program.save){
				console.log("save " + moduleName + " to dependencies");
			}
		}else{
			console.log("install all dependencies");
		}
	});

// 更新一个模块
program
	.command('update [moduleName]')
	.description('update a module')
	.action(function(moduleName){
		if(moduleName){
			console.log("update " + moduleName);
		}else{
			console.log("update all dependencies");
		}
	});

program
	.command("publish [path]")
	.description("publish a module")
	.action(function(path){
		require("../command/publish.js")(path);
	});

program.parse(process.argv);