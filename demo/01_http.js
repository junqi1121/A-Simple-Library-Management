//:create server
var port=88;
var server = require('http').createServer(SendReq);
server.listen(port);

/**
 * 返回纯文本
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
function SendTxt(req,res)
{
	console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	res.setHeader('Content-Type','text/plain;charset=utf-8');
	res.end('管你什么请求，我都返回这段文本');
}

function Send404(req,res)
{
	console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	res.statusCode=404;
	res.setHeader('Content-Type','text/plain;charset=utf-8');
	res.end('管你什么请求，我都说找不着');
}

function SendReq(req,res)
{
	//console.log(req.method+' '+req.url+' HTTP/'+req.httpVersion);
	res.setHeader('Content-Type','text/plain;charset=utf-8');
	var txt=req.method+' '+req.url+' HTTP/'+req.httpVersion+'\n\n';
	for(var k in req.headers)
		txt+=k+' : '+req.headers[k]+'\n';
	console.log(txt);
	res.end('你的请求内容如下:\n-----------------------------\n'+txt+'\n');
}

function SendHtml(req,res)
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
	res.end(htm);
}

String.prototype.toHTML= function()
{
	return this.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
