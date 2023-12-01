'use strict';
const HTM=require('../lib').html;
const db=require("../coSqlite3");

exports.Register=function*(req,res)
{

	console.log("req",req);
	let body=req.body;
	body.uname=body.uname || '';
	body.pwd=body.pwd || '';
	body.uname=body.uname.trim();
	if(!body.uname || !body.pwd)
		return HTM.begin+'用户名或密码不能为空'+HTM.end;


	// 输出数据库db所有表的名字，以及其中含有的数据项数
	const tables=yield db.SingleSQL("SELECT * FROM sqlite_master WHERE type='table'");
	for(let table of tables)
	{
		console.log(table.name);
		const items=yield db.SingleSQL(`SELECT COUNT(*) FROM ${table.name}`);
		console.log(items);
	}
	//控制台输出分割线
	console.log("*****************************************************************************************")


	if(body.uname.length>10 || body.pwd.length>10)
		return HTM.begin+'用户名或密码长度不能超过10字符'+HTM.end;

	let rows=yield db.execSQL("select count(*) as cnt from users where uname=?",[body.uname]);
	if(rows[0].cnt>0)
		return HTM.begin+'用户名已存在'+HTM.end;

	yield db.execSQL("INSERT INTO users(uname,pwd) VALUES(?,?)",[body.uname,body.pwd]);
	rows=yield db.execSQL("select last_insert_rowid() as uid");

	//输出表user中的所有项，格式为关键字：值
	const users = yield db.execSQL("SELECT * FROM users");
	for (let user of users) {
		console.log(user);
	}
	//控制台输出分割线
	console.log("*****************************************************************************************")
	// 输出表sqlite_sequence中的所有项，格式为关键字：值
	const sqlite_sequence = yield db.execSQL("SELECT * FROM sqlite_sequence");
	for (let item of sqlite_sequence) {
		console.log(item);
	}
	
	return HTM.begin+'注册成功:uid='+rows[0].uid+HTM.end;



	
};

exports.Guide=function*(req,res)
{
	let user=req.session.user;
	let htm='<center><p>nodejs站点示例</p>';
	htm+='<p><br><a href="login.htm" target="content">登录</a></p>'
		+'<p><br><a href="list" target="content">显示所有内容</a></p>'
		+'<p><br><a href="listuser" target="content">显示所有用户</a></p>'
		+'<a href="reg.htm" target="content">注册</a><br><br>';
	if(user)
		htm+='<a href="query.htm" target="content">查询</a><br><br>'
			+'<a href="post.htm" target="content">发表</a><br><br>';
	htm+='</center>';
	return HTM.begin+htm+HTM.end;
};

exports.Login=function*(req,res)
{
	let body=req.body;
	body.uname=body.uname || '';
	body.pwd=body.pwd || '';

	let rows=yield db.execSQL("select uid,uname from users where uname=? and pwd=?",[body.uname,body.pwd]);
	if(rows.length!=1)
		return HTM.begin+'用户名或密码错误'+HTM.end;
	let row=rows[0];
	req.session.user={uid:row.uid,uname:row.uname};
	return HTM.begin+'登录成功'+HTM.end;
};

exports.List=function*(req,res)
{
	let htm='<style>td{font-size:12px}</style>'
		+'<center><table border=1 width=80% cellspacing=0 bordercolor=blue>'
		+'<tr bgcolor=silver><td align=center><b>用户</b></td></tr>';
	let rows=yield db.execSQL("SELECT uname FROM users");
	for(let row of rows)
		htm+="<tr><td>"+row.uname.toHTML()+"</td></tr>";
	htm+='</table></center>';
	return HTM.begin+htm+HTM.end;
};