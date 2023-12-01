'use strict';
const user=require('./user');
const txt=require('./txt');
const app=require('../WebApp');

app.route('/register','post',user.Register);
app.route('/guid','get',user.Guide);
app.route('/login','post',user.Login);
app.route('/listuser','get',user.List);

app.route('/post','post',txt.Post);
app.route('/list','get',txt.List);
app.route('/query','post',txt.Query);


