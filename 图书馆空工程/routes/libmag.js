'use strict';

const Database = require("../coSqlite3");

// 创建 SQLite3 数据库连接对象
const db = Database("lib.db");

//将检查日期格式封装成函数
//“yyyy - mm - dd”，如“2008 -08 -09”
function checkDate(date) {
    const reg = /^\d{4}-\d{2}-\d{2}$/;
    if (!reg.test(date)) {
        return false;
    }
    const year = parseInt(date.slice(0, 4));
    const month = parseInt(date.slice(5, 7));
    const day = parseInt(date.slice(8, 10));
    if (month < 1 || month > 12) {
        return false;
    }
    if (day < 1 || day > 31) {
        return false;
    }
    if ((month == 4 || month == 6 || month == 9 || month == 11) && day == 31) {
        return false;
    }
    if (month == 2) {
        if (day > 29) {
            return false;
        }
        if (day == 29 && !((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)) {
            return false;
        }
    }
    return true;
}


// 更新借阅记录
// 为啥非要用函数指针才能执行呢？调了半天，sql的执行前面也必须加 yield才能真正在数据库中起事务？
// 怪？
function* updateLoanRecordStatus() {
    console.log("******************************************updateLoanRecordStatus***********************************************");
    //  这里只去更新借出--->超期的状态    因为归还的状态  会在还书的时候执行
    try {
        // 获取当前日期
        const currentDate = new Date().toISOString().slice(0, 10);
        // 如果书的状态为借出，且归还日期为空值，那么将状态更新为超期
        yield db.execSQL('UPDATE loan_records SET status = "超期" WHERE status = "借出" AND returnDate IS NULL AND dueDate < ?', [currentDate]);         
    } catch (error) {
        console.error(`Error updating loan records status: ${error}`);
    }
}



// 初始化数据库
exports.InitDB = function* (req, res) {
    console.log("******************************************InitDB***********************************************");
    try {
        console.log("初始化数据库");
        // books表
        // 其中bCnt,bRemaining使用NUMERIC/DECIMAL确定数据类型
        const booksTableSQL = `CREATE TABLE IF NOT EXISTS books (
            bID TEXT PRIMARY KEY,
            bName TEXT,
            bPub TEXT,
            bDate DATE,
            bAuthor TEXT,
            bMem TEXT,
            bCnt NUMERIC(60,0) CHECK (bCnt > 0),
            bRemaining NUMERIC(60,0) CHECK (bRemaining >= 0)
        );`;
        
        // readers表
        const readersTableSQL = `CREATE TABLE IF NOT EXISTS readers (
            rID TEXT PRIMARY KEY,
            rName TEXT,
            rSex TEXT CHECK (rSex IN ('男', '女')),
            rDept TEXT,
            rGrade INTEGER CHECK (rGrade > 0)
        );`;

        // loan_records表  bID和rID是外键  loanID自动分配唯一递增的值
        const loanRecordsTableSQL = `CREATE TABLE IF NOT EXISTS loan_records (
            loanID INTEGER PRIMARY KEY AUTOINCREMENT,
            bID TEXT,
            rID TEXT,
            loanDate DATE, 
            dueDate DATE,
            returnDate DATE,
            status TEXT CHECK (status IN ('借出', '超期', '归还')),
            FOREIGN KEY (bID) REFERENCES books (bID),
            FOREIGN KEY (rID) REFERENCES readers (rID)
        );`;

        yield db.execSQL(booksTableSQL);
        yield db.execSQL(readersTableSQL);
        yield db.execSQL(loanRecordsTableSQL);


        
        // 输出数据库lib.db中所有表的名字，以及其中含有的数据项数
        const tables = yield db.execSQL("SELECT name FROM sqlite_master WHERE type='table'");
        for (let table of tables) {
            const count = yield db.execSQL(`SELECT COUNT(*) FROM ${table.name}`);
            console.log(`${table.name}表中有${count[0]['COUNT(*)']}项数据`);
        }



        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
        return;
        } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">1</div>${error}</body></html>`);
        return;
        }
};


// 添加书籍
exports.AddBook = function* (req, res) {
    console.log("******************************************AddBook***********************************************")
    try {
        const { bID, bName, bPub, bDate, bAuthor, bMem, bCnt } = req.body;
        console.log(req.body);
        // （bID） 非空且最多30个字符
        if (!bID || bID.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求</body></html>');
            return;
        }

        // （bName）非空且最多30个字符
        if (!bName || bName.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书名不符合格式要求</body></html>');
            return;
        }

        // （bPub） 最多30个字符，可为空
        if (bPub && bPub.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版社名不符合格式要求</body></html>');
            return;
        }
        console.log("bDate:", bDate);
        console.log("checkDate(bDate):", checkDate(bDate));
        // 日期 符合格式 yyyy-mm-dd 如：2008-09-09 可为空
        if(bDate&& !checkDate(bDate)){
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求</body></html>');
            return;
        }

        // b.Author 可为空且最多20个字符
        if (bAuthor && bAuthor.length > 20) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：作者名不符合格式要求</body></html>');
            return;
        }
        // b.Mem 可为空且最多30个字符
        if (bMem && bMem.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：内容摘要不符合格式要求</body></html>');
            return;
        }
        // bCnt 为正整数 非空
        if (isNaN(bCnt) || bCnt <= 0 || bCnt % 1 !== 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：数量应该是正整数</body></html>');
            return;
        }

        // 书籍是否已存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        if (existingBook && existingBook.length > 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该书已经存在</body></html>');
            return;
        }

        //   插入新书籍信息
        const insertBookSQL = 'INSERT INTO books (bID, bName, bPub, bDate, bAuthor, bMem, bCnt, bRemaining) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const args = [bID, bName, bPub, bDate, bAuthor, bMem, bCnt, bCnt];
        

        // // debug一下
        // console.log("args:",args);


        yield db.execSQL(insertBookSQL, args);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');


        // //添加成功后,输出books表
        // const books = yield db.execSQL('SELECT * FROM books');
        // console.log(books);

        // // 输出books表中的所有关键字的值
        // for (let book of books) {
        //     console.log("表中的值：",book.bID, book.bName, book.bPub, book.bDate, book.bAuthor, book.bMem, book.bCnt, book.bRemaining);
        // }

        return;
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};


// 增加书籍数量
exports.IncreaseBookCount = function* (req, res) {
    console.log("******************************************IncreaseBookCount***********************************************")
    try {
        const { bID, bCnt } = req.body;
        console.log(req.body);

        // bID 非空 且最多30个字符
        if (!bID || bID.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求</body></html>');
            return;
        }

        // bCnt 为正整数 非空
        if (isNaN(bCnt) || bCnt <= 0 || bCnt % 1 !== 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：数量应该是正整数</body></html>');
            return;
        }

        // 查询来检查书籍是否存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        if (!existingBook || existingBook.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该书不存在</body></html>');
            return;
        }


        console.log("更新前",existingBook);

        //  增加书籍数量   bcnt = bCnt + ?    bRemaining = bRemaining + ?
        const updateBookSQL = 'UPDATE books SET bCnt = bCnt + ?, bRemaining = bRemaining + ? WHERE bID = ?';
        const args = [bCnt, bCnt, bID];
        yield db.execSQL(updateBookSQL, args);

        // 输出表中刚才添加书籍的信息
        const books = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        console.log("更新后",books);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};


// 删除书籍
exports.DeleteBook = function* (req, res) {
    console.log("******************************************DeleteBook***********************************************");


    try {
        const { bID, bCnt } = req.body;
        console.log(req.body);

        // bID 必填 且最多30个字符
        if (!bID || bID.length > 30) {
            res.send('<html><body><div id="result" style="display:none">3</div>提交的参数有误：书号不符合格式要求</body></html>');
            return;
        }


        // 验证数量（bCnt）是否为正整数 必填
        if (isNaN(bCnt) || bCnt <= 0 || bCnt % 1 !== 0) {
            res.send('<html><body><div id="result" style="display:none">3</div>提交的参数有误：数量应该是正整数</body></html>');
            return;
        }


        // 查询来检查书籍是否存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        console.log("existingBook:", existingBook);
        if (!existingBook || existingBook.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该书不存在</body></html>');
            return;
        }


        
        //检测  大于减少的数量大于该书目前在库（未借出）的数量
        if (bCnt > existingBook[0].bRemaining) {
            res.send('<html><body><div id="result" style="display:none">2</div>减少的数量大于该书目前在库数量</body></html>')
            return;
        }

        console.log("更新前", existingBook);


        // 如果将这个书删光了，那么就删除这个书的所有借阅记录，并且删掉这个书
        console.log("bCnt:", existingBook[0].bCnt, "bRemaining:", existingBook[0].bRemaining, bCnt);
        console.log("bCnt == bCnt:", existingBook[0].bCnt == bCnt);
        if (existingBook[0].bCnt == bCnt) {
            // 删除这个书相关的借阅记录 (解决外键约束)
            yield db.execSQL('DELETE FROM loan_records WHERE bID = ?', [bID]);
            yield db.execSQL('DELETE FROM books WHERE bID = ?', [bID]);
        }
        else {
            //  执行 SQL 更新来减少书籍数量   bCnt = bCnt - ?    bRemaining = bRemaining - ?
            const updateBookSQL = 'UPDATE books SET bCnt = bCnt - ?, bRemaining = bRemaining - ? WHERE bID = ?';
            const args = [bCnt, bCnt, bID];
            yield db.execSQL(updateBookSQL, args);
        }

        // 输出表中刚才减少书籍的信息
        const books = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        console.log("更新后", books);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }


};



// 修改书籍信息
exports.ModifyBookInfo = function* (req, res) {
    console.log("******************************************ModifyBookInfo***********************************************");

    try {
        const { bID, bName, bPub, bDate, bAuthor, bMem } = req.body;

        // （bID）  不空，且最多30个字符
        if (!bID || bID.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求</body></html>');
            return;
        }
        // （bName）  不空，且最多30个字符
        if (!bName || bName.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书名不符合格式要求</body></html>');
            return;
        }
        // （bPub）  最多30个字符，可为空
        if (bPub && bPub.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版社名不符合格式要求</body></html>');
            return;
        }

        // （bDate）  如果存在。是否是一个合法的日期，且是否符合格式
        //格式为“yyyy-mm-dd”，“2008-08-09”
        if (bDate && !checkDate(bDate)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求</body></html>');
            return;
        }

        // bAuthor  如果存在，最多20个字符
        if (bAuthor && bAuthor.length > 20) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：作者名不符合格式要求</body></html>');
            return;
        }

        // bMem  如果存在，最多30个字符
        if (bMem && bMem.length > 30) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：内容摘要不符合格式要求</body></html>');
            return;
        }




        // 检查书籍是否存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);

        if (!existingBook || existingBook.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该书不存在</body></html>');
            return;
        }

        console.log("更新前", existingBook);

        // 构建语句和参数
        let updateFields = '';
        const updateArgs = [];
        if (bName) {
            // bName 一定会有值，所以不用判断是否为空
            updateFields += ', bName = ?';
            updateArgs.push(bName);
        }
        if (bPub) {
            updateFields += ', bPub = ?';
            updateArgs.push(bPub);
        }
        if (bDate) {
            updateFields += ', bDate = ?';
            updateArgs.push(bDate);
        }
        if (bAuthor) {
            updateFields += ', bAuthor = ?';
            updateArgs.push(bAuthor);
        }
        if (bMem) {
            updateFields += ', bMem = ?';
            updateArgs.push(bMem);
        }

        updateFields = updateFields.slice(2); // 去除开头的逗号和空格

        // 更新书籍信息
        const updateBookSQL = `UPDATE books SET ${updateFields} WHERE bID = ?`;
        updateArgs.push(bID);
        yield db.execSQL(updateBookSQL, updateArgs);

        // // 输出表中刚才修改书籍的信息
        // const books = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        // console.log("更新后", books);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};



// 查找书籍
exports.SearchBooks = function* (req, res) {
    console.log("******************************************SearchBooks***********************************************");
    try {
        const { bID, bName, bPub, bDate0, bDate1, bAuthor, bMem } = req.body;
        
        // 构建语句和参数
        let whereClause = '';
        const whereArgs = [];

        if (bID) {
            whereClause += ' AND bID LIKE ?';
            whereArgs.push(`%${bID}%`);
        }

        if (bName) {
            whereClause += ' AND bName LIKE ?';
            whereArgs.push(`%${bName}%`);
        }

        if (bPub) {
            whereClause += ' AND bPub LIKE ?';
            whereArgs.push(`%${bPub}%`);
        }

        // 如果输入的日期格式不正确，则向sql语句中添加一个恒假的条件？？?
        // 如果只填一个日期？？？
        if (bDate0 && !checkDate(bDate0)) {
            whereClause += ' AND 1=2';
        }
        else if (bDate1 && !checkDate(bDate1)) {
            whereClause += ' AND 1=2';
        }
        else if (bDate0 && bDate1) {
            whereClause += ' AND bDate BETWEEN ? AND ?';
            whereArgs.push(bDate0, bDate1);
        }

        // 如果只填写一个日期
        else if (bDate0 && !bDate1) {
            whereClause += ' AND bDate >= ?';
            whereArgs.push(bDate0);
         }
        else if (!bDate0 && bDate1) {
            whereClause += ' AND bDate <= ?';
            whereArgs.push(bDate1);
        }


        if (bAuthor) {
            whereClause += ' AND bAuthor LIKE ?';
            whereArgs.push(`%${bAuthor}%`);
        }

        if (bMem) {
            whereClause += ' AND bMem LIKE ?';
            whereArgs.push(`%${bMem}%`);
        }

        // 执行 SQL 查询
        const querySQL = `SELECT * FROM books WHERE 1=1 ${whereClause}`;
        const books = yield db.execSQL(querySQL, whereArgs);
        
        // 控制台中显示出books中每本书的bID，bName，bCnt，bRemaining，bPub，bDate，bAuthor，bMem
        // 其中bCnt,bRemaining不要以科学计数法的形式显示
        for (let book of books) {
            console.log(book.bID, book.bName, book.bCnt, book.bRemaining, book.bPub, book.bDate, book.bAuthor, book.bMem);
        }


        // 生成 HTML 表格
        // 其中bCnt,bRemaining不要以科学计数法的形式显示
        let tableHTML = '<html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head><body><table border=1 id=\'result\'>';
        for (let book of books) {
            tableHTML += `<tr><td>${book.bID}</td><td>${book.bName}</td><td>${book.bCnt}</td><td>${book.bRemaining}</td><td>${book.bPub}</td><td>${book.bDate}</td><td>${book.bAuthor}</td><td>${book.bMem}</td></tr>`;
        }
        tableHTML += '</table></body></html>';



        

        res.send(tableHTML);
    } catch (error) {
        res.send(`<html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }

};

// 添加读者
exports.AddReader = function* (req, res) {
    console.log("******************************************AddReader***********************************************");

    try {
        const { rID, rName, rSex, rDept, rGrade } = req.body;

        // rID 必填，且最多8个字符
        if (!rID || rID.length > 8) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的证号，最多8个字符</body></html>');
            return;
        }
        // rName 必填，且最多10个字符
        if (!rName || rName.length > 10) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的姓名，最多10个字符</body></html>');
            return;
        }
        // rSex 必填，且只能是“男”或“女”
        if (!rSex || !/^(男|女)$/i.test(rSex)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的性别，只能是“男”或“女”</body></html>');
            return;
        }
        // rDept 非必填，且最多10个字符
        if (rDept && rDept.length > 10) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的院系，最多10个字符</body></html>');
            return;
        }
        //rGrade 非必填，应该是正整数
        if (rGrade && (isNaN(rGrade) || rGrade <= 0 || rGrade % 1 !== 0)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的年级，应该是正整数</body></html>');
            return;
        }
        

        // 查询是否存在相同的证号
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);

        console.log("existingReader:",existingReader);

        if (existingReader && existingReader.length > 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号已经存在</body></html>');
            return;
        }

        // 执行 SQL 插入语句
        const insertReaderSQL = 'INSERT INTO readers (rID, rName, rSex, rDept, rGrade) VALUES (?, ?, ?, ?, ?)';
        const args = [rID, rName, rSex, rDept, rGrade];
        yield db.execSQL(insertReaderSQL, args);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};


// 修改读者信息
exports.ModifyReaderInfo = function* (req, res) {
    console.log("******************************************ModifyReaderInfo***********************************************");

    try {
        const { rID, rName, rSex, rDept, rGrade } = req.body;


        // rID 必填，且最多8个字符
        if (!rID || rID.length > 8) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的证号，最多8个字符</body></html>');
            return;
        }
        // rName 非必填，且最多10个字符
        if (rName && rName.length > 10) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的姓名，最多10个字符</body></html>');
            return;
        }
        // rSex 非必填，且只能是“男”或“女”
        if (rSex && !/^(男|女)$/i.test(rSex)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的性别，只能是“男”或“女”</body></html>');
            return;
        }
        // rDept 非必填，且最多10个字符
        if (rDept && rDept.length > 10) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的院系，最多10个字符</body></html>');
            return;
        }
        //rGrade 非必填，应该是正整数
        if (rGrade && (isNaN(rGrade) || rGrade <= 0 || rGrade % 1 !== 0)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请填写正确的年级，应该是正整数</body></html>');
            return;
        }

        // 查询是否存在相同的证号
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);
        if (!existingReader || existingReader.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        // 构建sql语句，依次添加更改信息
        let updateFields = '';
        const updateArgs = [];
        if (rName) {
            updateFields += ', rName = ?';
            updateArgs.push(rName);
        }
        if (rSex) {
            updateFields += ', rSex = ?';
            updateArgs.push(rSex);
        }
        if (rDept) {
            updateFields += ', rDept = ?';
            updateArgs.push(rDept);
        }
        if (rGrade) {
            updateFields += ', rGrade = ?';
            updateArgs.push(rGrade);
        }

        updateFields = updateFields.slice(2); // 去除开头的逗号和空格
        
        //当一个条件都没有更改时：
        if (!rName && !rSex && !rDept && !rGrade) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：请至少填写一个要更改的信息</body></html>');
            return;
        }

        
        const updateReaderSQL = `UPDATE readers SET ${updateFields} WHERE rID = ?`;
        updateArgs.push(rID);

        // 执行 SQL 更新语句
        yield db.execSQL(updateReaderSQL, updateArgs);

        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};


// 查找读者
exports.SearchReaders = function* (req, res) {
    console.log("******************************************QueryReaderInfo***********************************************");

    try {
        const { rID, rName, rSex, rDept, rGrade0, rGrade1 } = req.body;


        // 填写的年级合法性判断（必须为正整数）
        if (rGrade0 && (isNaN(rGrade0) || rGrade0 <= 0 || rGrade0 % 1 !== 0)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
            return;
        }
        if (rGrade1 && (isNaN(rGrade1) || rGrade1 <= 0 || rGrade1 % 1 !== 0)) {
            res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
            return;
        }

        // 构建 SQL 查询语句
        let querySQL = 'SELECT * FROM readers WHERE 1=1';
        const args = [];

        // 添加条件
        if (rID) {
            querySQL += ' AND rID LIKE ?';
            args.push(`%${rID}%`);
        }

        if (rName) {
            querySQL += ' AND rName LIKE ?';
            args.push(`%${rName}%`);
        }

        if (rSex) {
            querySQL += ' AND rSex = ?';
            args.push(rSex);
        }

        if (rDept) {
            querySQL += ' AND rDept LIKE ?';
            args.push(`%${rDept}%`);
        }

        if (rGrade0 && rGrade1) {
            querySQL += ' AND rGrade >= ? AND rGrade <= ?';
            args.push(rGrade0, rGrade1);
        }

        // 年级如果只填写了一个
        if (rGrade0 && !rGrade1) {
            querySQL += ' AND rGrade >= ?';
            args.push(rGrade0);
        }
        if (!rGrade0 && rGrade1) {
            querySQL += ' AND rGrade <= ?';
            args.push(rGrade1);
        }



        // 执行 SQL 查询语句
        const result = yield db.execSQL(querySQL, args);

        // 构建 HTML 表格
        let html = '<html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head><body><table border=1 id=\'result\'>';
        for (let row of result) {
            html += `<tr><td>${row.rID}</td><td>${row.rName}</td><td>${row.rSex}</td><td>${row.rDept}</td><td>${row.rGrade}</td></tr>`;
        }
        html += '</table></body></html>';

        res.send(html);
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};


// 还书
exports.ReturnBook = function* (req, res) {
    console.log("******************************************ReturnBook***********************************************");

    try {

        // 更新借阅记录状态
        yield* updateLoanRecordStatus();     

        const { rID, bID } = req.body;

        // 验证证号和书号是否存在
        if (!rID) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        if (!bID) {
            res.send('<html><body><div id="result" style="display:none">2</div>该书号不存在</body></html>');
            return;
        }

        // 从readers表中查询rID是否存在
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);
        if (!existingReader || existingReader.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        // 从books表中查询bID是否存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        if (!existingBook || existingBook.length == 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>该书号不存在</body></html>');
            return;
        }



        // 查询借阅记录  状态应为“借出”或者“超期”
        const loanRecord = yield db.execSQL('SELECT * FROM loan_records WHERE rID = ? AND bID = ? AND (status = "借出" OR status = "超期")', [rID, bID]);
        

        // 如果借阅记录不存在，则说明读者未借阅该书
        if (!loanRecord || loanRecord.length == 0) {
            res.send('<html><body><div id="result" style="display:none">3</div>该读者并未借阅该书</body></html>');
            return;
        }


        // 如果借阅记录存在，则说明读者已借阅该书
        // 更新借阅记录状态为“归还”并更新归还日期
        // 日期格式为"yyyy-mm-dd"
        const returnDate = new Date().toISOString().slice(0, 10);


        yield db.execSQL('UPDATE loan_records SET status = "归还", returnDate = ? WHERE rID = ? AND bID = ?', [returnDate, rID, bID]);

        // 更新书籍在库数量
        yield db.execSQL('UPDATE books SET bRemaining = bRemaining + 1 WHERE bID = ?', [bID]);
        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
    }
};

// 借书
exports.BorrowBook = function* (req, res) {
    console.log("******************************************BorrowBook***********************************************");
    try{
        const{rID,bID}=req.body;
        // 验证证号和书号是否存在
        if (!rID) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在或未填写</body></html>');
            return;
        }
        if(!bID){
            res.send('<html><body><div id="result" style="display:none">2</div>该证号不存在或未填写</body></html>');
            return;           
        }
        //从readers表中查询rID是否存在
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);
        if (!existingReader || existingReader.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        //从books表中查询bID是否存在
        const existingBook = yield db.execSQL('SELECT * FROM books WHERE bID = ?', [bID]);
        if (!existingBook || existingBook.length == 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>该书号不存在</body></html>');
            return;
        }


        // 更新借阅记录
        yield*  updateLoanRecordStatus();

        
        // 查询该读者是否有书超期未还
        const loanRecord = yield db.execSQL('SELECT * FROM loan_records WHERE rID = ? AND status = "超期"', [rID]);
        // 如果有超期未还
        if (loanRecord && loanRecord.length > 0) {
            res.send('<html><body><div id = "result" style = "display:none">3</div>该读者有超期书未还</body></html>');
            return;
        }

        // 该读者已经借阅该书，且未归还
        const loanRecord1 = yield db.execSQL('SELECT * FROM loan_records WHERE rID = ? AND bID = ? AND status = "借出"', [rID, bID]);
        if (loanRecord1 && loanRecord1.length > 0) {
            res.send('<html><body><div id = "result" style = "display:none">4</div>该读者已经借阅该书，且未归还</body></html>');
            return;
        }

        //该书已经全部借出
        const loanRecord2 = yield db.execSQL('SELECT * FROM books WHERE bID = ? AND bRemaining = 0', [bID]);
        if (loanRecord2 && loanRecord2.length > 0) {
            res.send('<html><body><div id = "result" style = "display:none">5</div>该书已经全部借出</body></html>');
            return;
        }

        //可以借书,应还日期为当天的60天后
        // 日期格式为"yyyy-mm-dd"
        const borrowDate = new Date().toISOString().slice(0, 10);
        const dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        // 插入借阅记录,包括bID,rID,borrowDate,dueDate,returnDate,status
        const insertLoanRecordSQL = 'INSERT INTO loan_records (bID, rID, borrowDate, dueDate, returnDate,status) VALUES (?,?,?,?,?,?)';
        
        const args = [bID, rID, borrowDate, dueDate, null, "借出"];
        yield db.execSQL(insertLoanRecordSQL, args);




        
        // 更新书籍在库数量
        yield db.execSQL('UPDATE books SET bRemaining = bRemaining - 1 WHERE bID = ?', [bID]);
        res.send('<html><body><div id = "result" style = "display:none"> 0</div>成功</body></html>');
        return;
    }
    catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
        return;
    }
};

// 删除读者
exports.DeleteReader = function* (req, res) {
    console.log("******************************************DeleteReader***********************************************");
    try{
        // 更新借阅记录状态
        yield* updateLoanRecordStatus();

        const {rID} = req.body;
        // 该证号未填写
        if (!rID||rID.length>8) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }
        // 查询该证号是否存在
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);
        if (!existingReader || existingReader.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        

        //  查询该读者是否有书籍未归还  状态为借出或者超期
        const loanRecord = yield db.execSQL('SELECT * FROM loan_records WHERE rID = ? AND (status = "借出" OR status = "超期")', [rID]);
        if (loanRecord && loanRecord.length > 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>该读者尚有书籍未归还</body></html>');
            return;
        }


        // 删除这个读者相关的借阅记录
        const deleteLoanRecordSQL = 'DELETE FROM loan_records WHERE rID = ?';
        yield db.execSQL(deleteLoanRecordSQL, [rID]);

        // 删除读者
        const deleteReaderSQL = 'DELETE FROM readers WHERE rID = ?';
        yield db.execSQL(deleteReaderSQL, [rID]);


        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
        return;
    }
    catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
        return;
    }
};


// 查看读者未还书籍
exports.CheckUnreturnedBooks = function* (req, res) {
    console.log("******************************************CheckUnreturnedBooks***********************************************");
    try {
        const { rID } = req.body;

        // 该证号未填写
        if (!rID) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        // 查询该证号是否存在
        const existingReader = yield db.execSQL('SELECT * FROM readers WHERE rID = ?', [rID]);
        if (!existingReader || existingReader.length == 0) {
            res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
        }

        // 更新借阅记录状态
        yield* updateLoanRecordStatus();




        


        
        // 查询该读者的未归还书籍（条件为：状态为借出或者超期）
        const unreturnedBooks = yield db.execSQL(`
            SELECT loan_records.bID, books.bName, loan_records.borrowDate, loan_records.dueDate, loan_records.status
            FROM loan_records
            JOIN books ON loan_records.bID = books.bID
            WHERE loan_records.rID = ? AND (loan_records.status = "借出" OR loan_records.status = "超期")
        `, [rID]);


        // 如果该读者目前没有任何在借书籍，则返回空表格
        if (!unreturnedBooks || unreturnedBooks.length == 0) {
            res.send('<html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head><body><table border=1 id="result"></table></body></html>');
            return;
        }

        //  在控制台输出unreturnedBooks 的每个元素
        console.log("unreturnedBooks:",unreturnedBooks);


        // 构建HTML表格
        const tableHtml = `
            <html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head>
            <body>
            <table border=1 id='result'>
                ${unreturnedBooks.map(book => `<tr><td>${book.bID}</td><td>${book.bName}</td><td>${book.borrowDate}</td><td>${book.dueDate}</td><td>${book.status =='超期' ? "是" : "否"}</td></tr>`).join('')}
            </table>
            </body></html>
        `;

        res.send(tableHtml);
        return;
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>提交的参数有误：${error}</body></html>`);
        return
    }
};


// 获取超期读者列表
exports.GetOverdueReaders = function* (req, res) {
    console.log("******************************************生成超期读者列表***********************************************");
    try {
        // 更新借阅记录状态
        yield* updateLoanRecordStatus();

        // 查询超期读者 且去重
        const overdueReaders = yield db.execSQL(`
            SELECT DISTINCT readers.rID, readers.rName, readers.rSex, readers.rDept, readers.rGrade
            FROM loan_records
            JOIN readers ON loan_records.rID = readers.rID
            WHERE loan_records.status = "超期"
        `);

  

        // 没有读者满足条件  返回空表格
        if (!overdueReaders || overdueReaders.length == 0) {
            res.send('<html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head><body><table border=1 id="result"></table></body></html>');
            return;
        }

        // HTML表格
        const tableHtml = `
            <html><head><META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8"></head>
            <body>
            <table border=1 id='result'>
                ${overdueReaders.map(reader => `<tr><td>${reader.rID}</td><td>${reader.rName}</td><td>${reader.rSex}</td><td>${reader.rDept}</td><td>${reader.rGrade}</td></tr>`).join('')}
            </table>
            </body></html>
        `;
        res.send(tableHtml);
        return;
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>生成超期读者列表失败：${error}</body></html>`);
        return;
    }

};


// 测试专用路由
exports.Test = function* (req, res) {
    console.log("******************************************Test***********************************************");
    try {
        // 将bID=12 rID=A-1 的借阅记录状态更改为借出
        yield db.execSQL('UPDATE loan_records SET status = "借出" WHERE bID = ? AND rID = ?', ['12', 'A-1']);
        res.send('<html><body><div id="result" style="display:none">1</div>成功</body></html>');
        return;
        
    } catch (error) {
        res.send(`<html><body><div id="result" style="display:none">2</div>失败：${error}</body></html>`);
        return;
    }
   
};