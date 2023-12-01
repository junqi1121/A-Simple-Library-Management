'use strict';
const HTM=require('../lib').html;
const db=require("../coSqlite3");
const StrTime=require('../lib').StrTime;

exports.Post=function*(req,res)
{
	let user=req.session.user,body=req.body;
	if(!user) return HTM.begin+'<FONT COLOR="red">尚未登录，不能发表</font>'+HTM.end;
	if(!body.txt)
		return HTM.begin+'发表内容不能为空'+HTM.end;
	if(body.txt.length>255)
		return HTM.begin+'发表内容长度不能超过255字'+HTM.end;

	let t=Math.round(new Date().getTime()/1000);//获得当前时间戳(精度秒)
	yield db.execSQL("INSERT INTO txt(uid,dt,txt) VALUES(?,?,?)",[user.uid,t,body.txt]);
	return HTM.begin+'成功发表'+HTM.end;
};

exports.List=function*(req,res)
{
	let htm='<style>td{font-size:12px}</style>'
		+'<center><table border=1 width=80% cellspacing=0 bordercolor=blue>'
		+'<tr bgcolor=silver><td align=center><b>作者</b></td><td align=center><B>时间</B></td><td align=center><B>内容</B></td></tr>';
	let rows=yield db.execSQL("SELECT uname,dt,txt FROM txt,users WHERE txt.uid=users.uid ORDER BY dt DESC");
	for(let row of rows)
		htm+='<tr><td>'+row.uname.toHTML()+'</td><td>'
			+StrTime(row.dt*1000,'yyyy-mm-dd hh:nn:ss')//时间格式转换
			+'</td><td>'+row.txt+'</td></tr>';
	htm+='</table></center>';
	return HTM.begin+htm+HTM.end;
};

exports.Query=function*(req,res)
{
	let user=req.session.user,body=req.body;
	if(!user) return HTM.begin+'<FONT COLOR="red">尚未登录</font>'+HTM.end;
	let cnd='',sql="SELECT uname,dt,txt FROM txt,users WHERE txt.uid=users.uid";
	if(body.uname)
		cnd+=" AND uname like '%"+body.uname.replace(/\x27/g,"''")+"%'";
	if(body.txt)
		cnd+=" AND txt like '%"+body.txt.replace(/\x27/g,"''")+"%'";
	sql+=cnd+" ORDER BY dt DESC";

	let htm='<style>td{font-size:12px}</style>'
		+'<center><table border=1 width=80% cellspacing=0 bordercolor=blue>'
		+'<tr bgcolor=silver><td align=center><b>作者</b></td><td align=center><B>时间</B></td><td align=center><B>内容</B></td></tr>';
	let rows=yield db.execSQL(sql);
	for(let row of rows)
		htm+='<tr><td>'+row.uname.toHTML()+'</td><td>'
			+StrTime(row.dt*1000,'yyyy-mm-dd hh:nn:ss')//时间格式转换
			+'</td><td>'+row.txt+'</td></tr>';
	htm+='</table></center>';
	return HTM.begin+htm+HTM.end;
};