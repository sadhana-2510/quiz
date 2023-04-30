const express = require('express');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const session = require("express-session");
const fs = require('fs');
const mysql = require('mysql2');
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "amar",
    saveUninitialized: true,
    resave: true
}));

app.use('/', express.static('./public'));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'quiz-user',
    password: 'password',
    database: 'quiz',
    insecureAuth:true 
});


app.post('/login', async (req, res) => {
    const userName = req.body.username;
    const password = req.body.password;
    let dbUser;
    console.log('user name from  the form ' + userName)
    req.session.loggedInUser = userName
    dbUser = await getUser(userName, password);
    let sendFile = __dirname + "/home.html";
    if(dbUser === null || dbUser == undefined){
        req.session.loginStatus = false;
        console.log('login failed');
        sendFile = __dirname + "/login.html"
    }
    console.log('user from the data base ->' + dbUser);
    res.sendFile(sendFile)
});

getUser = (username, password) =>{
    return new Promise((resolve, reject)=>{
        // query the data base
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            console.log('connected as id ' + connection.threadId);
            let selectQuery = 'SELECT * FROM quiz_users WHERE user_name = ? and pass = ?';
            let query = mysql.format(selectQuery, [username, password]);
            connection.query(query, (err, rows) => {
                connection.release(); // return the connection to pool
                if (err) return reject(err);
                console.log('The data from users table are: \n', rows);
                dbUser = rows[0];
                return resolve(dbUser);
            });
        });
    });
};

app.get('/loggedInUser', (req, res) => {
    console.log('loggedInUser is ' + req.session.loggedInUser);
    const loggedInUser = {
        userName: req.session.loggedInUser
    }
    res.send(loggedInUser);
});

app.get('/loginStatus', (req, res) => {
    console.log('login status ->' + req.session.loginStatus);
    const loginStatus = {
        status : req.session.loginStatus
    }
    res.send(loginStatus);
});

app.get('/signUpPage', (req, res) =>{
    res.sendFile(__dirname+'/signup.html')
});

app.post('/signup', async (req, res) =>{
    const fullName = req.body.fullname;
    const username = req.body.username;
    const password = req.body.password;
    await createUser(fullName, username, password);
    res.sendFile(__dirname+'/login.html')
});

createUser = (fullname, username, password) =>{
    return new Promise((resolve, reject)=>{
        // query the data base
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            console.log('connected as id ' + connection.threadId);
            let inserQuery = 'insert into quiz_users (user_name, pass, full_name) values (?,?,?)';
            let query = mysql.format(inserQuery, [username, password, fullname]);
            connection.query(query, (err, rows) => {
                connection.release(); // return the connection to pool
                if (err) return reject(err);
                console.log('The data from users table are: \n', rows);
                return resolve(rows);
            });
        });
    });
};

app.get('/quiz', (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

app.post('/loadQuestions', (req, res) => {
    req.session.level = req.body.level;
    console.log(req.session.level);
    res.sendFile(__dirname + "/quiz.html");
});

app.get('/questions', (req, res) => {
    const fileName = "./" + req.session.level + ".json"
    const data = fs.readFileSync(fileName, {encoding:'utf8'});    
    console.log(data);
    const questions = {
        loggedInUser : req.session.loggedInUser , 
        level: req.session.level,
        questionList: JSON.parse(data)
    }
    res.send(questions);
});

app.post('/questions', async (req, res) => {
    console.log(req.body);
    const answers= req.body;
    const level = answers.level;
    const fileName = "./" + level + ".json"
    const questionList = fs.readFileSync(fileName, {encoding:'utf8'});
    const questions = JSON.parse(questionList);
    // Look through and validate
    let correctedResponses = [];
    let score = 0;
    questions.forEach(question => {
        let correctedResponse = {
            id : question.id,
            providedAnswer: answers[question.id],
            correctAnswer: question.correctAnswer
        }
        if(question.correctAnswer === answers[question.id]){
           correctedResponse.correct = true
           score = score + 1;
        } else 
        {
            correctedResponse.correct = false;
        }
        correctedResponses.push(correctedResponse);
    });
    req.session.correctedResponses = correctedResponses;
    req.session.score = score;
    await createResult(req.session.loggedInUser, score, req.session.level);
    res.sendFile(__dirname + "/results.html");
});

createResult = (username, score, level) =>{
    return new Promise((resolve, reject)=>{
        // query the data base
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            console.log('connected as id ' + connection.threadId);
            let inserQuery = 'insert into quiz_results (user_name, score, level) values (?,?,?)';
            let query = mysql.format(inserQuery, [username, score, level]);
            connection.query(query, (err, rows) => {
                connection.release(); // return the connection to pool
                if (err) return reject(err);
                console.log('The data from users table are: \n', rows);
                return resolve(rows);
            });
        });
    });
};

app.get('/results', (req, res) => {
    console.log('Retrieiving the result from session');
    const results = {
        user : req.session.loggedInUser,
        level: req.session.level,
        correctedResponses: req.session.correctedResponses,
        score: req.session.score,
    }
    res.send(results);
});

app.get('/home', (req, res) => {
    res.sendFile(__dirname + "/home.html");
});

app.get('/prevScores', async (req, res) => {
    console.log('Retrieiving the result from session');
    const scores = await getScores(req.session.loggedInUser);
    const prevScores = {
        user : req.session.loggedInUser,
        prevScores : scores,
    }
    res.send(prevScores);
});

getScores = (username) =>{
    return new Promise((resolve, reject)=>{
        let scores;
        // query the data base
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            console.log('connected as id ' + connection.threadId);
            let inserQuery = 'select * from quiz_results where user_name = ?';
            let query = mysql.format(inserQuery, [username]);
            connection.query(query, (err, rows) => {
                connection.release(); // return the connection to pool
                if (err) return reject(err);
                console.log('The data from users table are: \n', rows);
                scores = rows;
                return resolve(scores);
            });
        });
    });
}

app.get('/loadPrevScores', async (req, res) => {
    res.sendFile(__dirname+"/prevscores.html");
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server running on port${port}`);
  });
