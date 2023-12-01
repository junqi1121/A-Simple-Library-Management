'use strict';
const app = require('../WebApp');
const  libmag = require('./libmag');


// 数据库初始化
app.route('/initdb', 'post', libmag.InitDB);

// 添加新书
app.route('/addbook', 'post', libmag.AddBook);

// 增加书籍数量
app.route('/increasebookcount', 'post', libmag.IncreaseBookCount);

// 删除书籍
app.route('/deletebook', 'post', libmag.DeleteBook);

// 修改书籍信息
app.route('/modifybookinfo', 'post', libmag.ModifyBookInfo);

// 查询书籍
app.route('/searchbooks', 'post', libmag.SearchBooks);

// 添加读者
app.route('/addreader', 'post', libmag.AddReader);

// 删除读者
app.route('/deletereader', 'post', libmag.DeleteReader);

// 修改读者信息
app.route('/modifyreaderinfo', 'post', libmag.ModifyReaderInfo);

// 查询读者
app.route('/searchreaders', 'post', libmag.SearchReaders);

// 查看未还书籍信息
app.route('/checkunreturnedbooks', 'post', libmag.CheckUnreturnedBooks);

// 借书
app.route('/borrowbook', 'post', libmag.BorrowBook);

// 还书
app.route('/returnbook', 'post', libmag.ReturnBook);

// 超期读者列表
app.route('/getoverduereaders', 'post', libmag.GetOverdueReaders);




// 自己编写函数，插入sql测试
app.route('/test', 'post', libmag.Test);
