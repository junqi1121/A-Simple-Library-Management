/**
 * 这是一个hello的例子
 */
const db=require("./coSqlite3");//myModules.js和coSqlite3.js在同一目录，所以用"./coSqlite3"
exports.Hello=function * (req,res){
	let rows=yield db.execSQL("select sql from sqlite_master where type='table'");//执行sql
	let htm='<html><head><META HTTP-EQUIV="Content-Type" Content="text-html; charset=utf-8"></head><body>';
	htm+='<b>Say <i style="color:#0000ff">'+req.url+'</i> to 数据库中的表们</b>';
	for(let row of rows){
		htm+='<hr>'+row.sql.replace(/\n/g,"<br>");
	}
	htm+='</body></html>'
	return htm;
}