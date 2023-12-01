'use strict';
String.prototype.toHTML= function()
{
	return this.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const srvstatic=require('serve-static');
const path = require("path");
//:init
const app=require('./WebApp')();
//根的重定向拦截器
app.use('/',function(req,res,next)
{
	var url = req._path;
	res.writeHead(302,{'Location':'/index.htm'
		//add other headers here...
	});
	res.end();
});
app.use(srvstatic(path.join(__dirname, '/static')));//静态文件服务中间件

app.use(function(req,res,next)
{//no-chache head for router and pre check
	res.setHeader('Cache-control','no-cache');
	res.setHeader('Pragma','no-cache');
	next();
});

app.use('/txt',SendTxt);
app.use('/req',SendReq);
app.use('/html',SendHtml);

function SendTxt(req,res,next)
{
	console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	res.send('txt请求返回');
}

function SendReq(req,res,next)
{
	console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	var txt=req.method+' '+req.url+' HTTP/'+req.httpVersion+'\n\n';
	res.send({request:txt,headers:req.headers});
}

function SendHtml(req,res,next)
{
	console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	res.setHeader('Content-Type','text/html;charset=utf-8');
	var htm='<html><head><title>测试</title></head><body>';
	htm+='<b>'+(req.method+' '+req.url+' HTTP/'+req.httpVersion).toHTML()+'</b><hr>';
	htm+='<ul>';
	for(var k in req.headers)
		htm+='<li><b>'+k.toHTML()+'</b>'+' : '+req.headers[k].toHTML()+'</li>';
	htm+='</ul>';
	htm+='</body>';
	res.send(htm);
}

//:handler error
app.use(function(err,req,res,next)
{
	if(!next)
		return res();//404
	//:log
	if(String==err.constructor)
		err={no:500,msg:err};
	if(null==err.no || null==err.msg || res.finished || res._sent)
		return next(err);//未处理的异常或处理了却无法发送的异常
	res.send(err);
});

//:create server
let port=80;
var server = require('http').createServer(app.OnRequest);
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error)
{
	if (error.syscall !== 'listen') {
		throw error;
	}
	// handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error('Port '+port+' requires elevated privileges');
		process.exit(1);
		break;
	case 'EADDRINUSE':
		console.error('Port '+port+' is already in use');
		process.exit(1);
		break;
	default:
		throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	console.log('Listening on ' + bind);
}

/**
 * 捕获未知异常，防止Node进程在异常时退出
 */
process.on('uncaughtException', function (err) {
	console.log(err);
});