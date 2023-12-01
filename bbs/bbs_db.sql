create table users
(
	uid integer primary key autoincrement,
	uname varchar(10) not null unique,
	pwd varchar(10) not null default "123"
);

create table txt
(
	id integer primary key autoincrement,
	uid int not null,
	dt int not null,/*从1970-1-1 00:00到记录时刻的秒数*/
	txt varchar(255) not null,
	foreign key(uid) references users(uid)
);