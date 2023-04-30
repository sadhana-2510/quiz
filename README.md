# QUIZ
Online Quiz based on HTML, CSS, JavaScript on frontend with NodeJS, MySQL on backend.

## Technologies used
1. JavaScript
2. HTML
3. CSS for styles
4. Nodejs for backend service
5. mySQL database

## Mysql settup and database creation

1. Download and install mysql database and workbench.
2. Connect to the mysql database server from mysql workbench using the root user and password.
3. Run the below script to create database,database user and grant option. 
    1. create database quiz;
    2. CREATE USER 'quiz-user'@'localhost' IDENTIFIED BY 'password';
    3. GRANT CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT, REFERENCES, RELOAD on *.* TO 'quiz-user'@'localhost' WITH GRANT OPTION;
4. create a new connection with the newly created user.
5. Run the below script to create table .
    1. use quiz;
    2. create table quiz_users(
   id INT NOT NULL AUTO_INCREMENT,
   user_name VARCHAR(40) NOT NULL,
   pass VARCHAR(40) NOT NULL,
   full_name VARCHAR(100) NOT NULL,
   PRIMARY KEY ( id ));
    3. create table quiz_results(
   id INT NOT NULL AUTO_INCREMENT,
   user_name VARCHAR(40) NOT NULL,
   score int NOT NULL,
   level varchar(20),
   date_taken datetime default now(),
   PRIMARY KEY ( id )
);

## How to run it locally?

1. clone the repository using URL https://github.com/sadhana-2510/quiz.git 
2. Run npm install to download all node packages.
3. Run node app.js to start the server.
4. Access the URL http://localhost:8080/quiz 



