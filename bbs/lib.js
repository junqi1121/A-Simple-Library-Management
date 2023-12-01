'use strict';
exports.html={
	begin:'<html><head><META HTTP-EQUIV="Content-Type" Content="text-html; charset=utf-8"></head><body>',
	end:'</body></html>'
};

exports.StrTime=function(D,fmt)
{//Date转换为字串表达(D=Date或Date的字串,fmt=格式，目前只支持"yyyy,mm,dd,hh,nn,ss"几个符号)
	if(String==D.constructor || Number==D.constructor)
		D=new Date(D);
	var d=(100000000+10000*D.getFullYear()+100*(D.getMonth()+1)+D.getDate()).toString();
	var t=(1000000+10000*D.getHours()+100*D.getMinutes()+D.getSeconds()).toString();
	return fmt.replace("yyyy",d.substr(1,4)).replace("mm",d.substr(5,2)).replace("dd",d.substr(7,2)).replace(
		"hh",t.substr(1,2)).replace("nn",t.substr(3,2)).replace("ss",t.substr(5,2)).replace("yy",d.substr(3,2));
};