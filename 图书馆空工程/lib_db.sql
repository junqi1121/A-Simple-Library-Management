create table books(
    bID TEXT PRIMARY KEY,
    bName TEXT,
    bPub TEXT,
    bDate DATE,
    bAuthor TEXT,
    bMem TEXT,
    bCnt INTEGER CHECK (bCnt > 0),
    bRemaining INTEGER CHECK (bRemaining >= 0)
);

create table readers(
    rID TEXT PRIMARY KEY,
    rName TEXT,
    rSex TEXT CHECK (rSex IN ('男', '女')),
    rDept TEXT,
    rGrade INTEGER CHECK (rGrade > 0)
);

create table loan_records(
    loanID TEXT PRIMARY KEY,
    bID TEXT,
    rID TEXT,
    borrowDate DATE,
    dueDate DATE,
    returnDate DATE,
    status TEXT CHECK (status IN ('借出', '归还', '超期')),
    FOREIGN KEY (bID) REFERENCES books (bID),
    FOREIGN KEY (rID) REFERENCES readers (rID)
);