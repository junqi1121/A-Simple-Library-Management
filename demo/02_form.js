var url=require('url');
var fs=require('fs');
function OnRequest(req,res)
{
	var URL=url.parse(req.url);
	var ext=URL.pathname.match(/\.([\w]+)$/);
	if(ext) ext=ext[1];
	if(!URL.search && ext)
	{//静态文件
		var ct;
		if(/^html?$/i.test(ext))
			ct='text/html';
		else if(/^(?:jpe?g|png|gif)$/i.test(ext))
			ct='image/'+ext.toLowerCase();
		else
			ct='application/octet-stream';
		fs.readFile('./static'+URL.pathname,function(err,data)
		{
			if(err)
			{
				res.statusCode=404;
				res.statusMessage='Not found';
				res.end('Not found');
				return;
			}
			res.setHeader('Content-Type',ct);
			res.end(data);
		});
		return;//静态文件处理完成
	}
	//:非静态文件访问
	req.rawBuf=[];
	req.on('data',function(chunk)
	{
		req.rawBuf.push(chunk);
	});
	req.on('end',function()
	{
		var data={};
		if('GET'==req.method)
			data=ParseData(URL.query || '');
		else if('POST'==req.method)
			data=ParseData(''+Buffer.concat(req.rawBuf));
		res.setHeader('Content-Type','text/plain;charset=utf-8');
		var txt=(data.name || '(未知)')
			+('1'==data.sex?'先生':'女士')+'，您好！'
			+'\n您的年龄是：'+(data.age|| '没有填写')
			+'\n您写的简介是：\n'+(data.txt || '您没有填写简介？');
		res.end(txt);
	});
}
var port=88;
var server = require('http').createServer(OnRequest);
server.listen(port);
console.log('listen on '+port);

function ParseData(s)
{
	s=s.split('&');
	var data={};
	for(var x of s)
	{
		x=x.split('=');
		data[x[0]]=decodeURIComponent(x[1]);
	}
	return data;
}