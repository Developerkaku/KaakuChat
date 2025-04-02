const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const { createServer } = require('node:http');
const { join, dirname } = require("node:path");
const { Server } = require('socket.io');
const fs = require("fs");
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { dir } = require('node:console');

const roomsList = new Object();

async function main() {
    //Opening the database file | Creating the database file
    const db = await open({
        filename: process.env.DB_PATH || 'chat.db',
        driver: sqlite3.Database
    });

    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {}
    });

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, "index.html"));
    });

    app.post('/create', (req, res) => {
        let roomName = req.body.roomName;
        let password = req.body.password;

        console.log(roomsList, req.body, roomName, password);

        if (roomsList[roomName]) {
            //update the index.html to show that the room already exists !
            fs.readFile(path.join(__dirname, "index.html"), "utf-8", (err, data) => {
                if (err) {
                    console.log("At room check /create")
                    console.log(err)
                    return res.status(500).send('An error occured at the server, please try again after some time \nIf the problem persists , contact me at ...');
                }

                const updatedErrorHml = data.replace(`<div id="appDetails" style="display: block;">`, `<div id="appDetails" style="display: none;">`)
                    .replace(`<form class="roomForm" id="createForm" action="/create" method="post" style="display: none;">`, `<form class="roomForm" id="createForm" action="/create" method="post" style="display: flex;">`)
                    .replace(`<div class="error-msg" style="display: none;">Room name already exists, Try adding extra characters</div>`, `<div class="error-msg" style="display: block;">Room name already exists, Try adding extra characters</div>`);

                console.log(updatedErrorHml);

                res.send(updatedErrorHml);
            });

            return;
            //aborting room creation (duplicates)
        }

        roomsList[roomName] = {
            password
        };

        fs.readFile(path.join(__dirname, "msg.html"), "utf8", (err, data) => {
            if (err) {
                console.log("At room creation")
                console.log(err)
                return res.status(500).send('An error occured at the server, please try again after some time \nIf the problem persists , contact me at ...');
            }

            const updatedMsgHTML = data.replace(`roomName: "emledu"`, `roomName: "${roomName}"`)
                .replace(`password: "emledu"`, `password: "${password}"`);

            res.send(updatedMsgHTML);
        });
    });

    app.post('/join', (req, res) => {
        let roomName = req.body.roomName;
        let password = req.body.password;

        if (!roomsList[roomName]) {
            fs.readFile(path.join(__dirname, "index.html"), "utf8", (err, data) => {
                if (err) {
                    console.log("At roomname check /join");
                    console.log(err);
                    return res.status(500).send('An error occured at the server, please try again after some time \nIf the problem persists , contact me at ...');
                }

                const updatedErrorHml = data.replace(`<div id="appDetails" style="display: block;">`, `<div id="appDetails" style="display: none;">`)
                    .replace(`<form class="roomForm" id="joinForm" action="/join" method="post" style="display: none;">`, `<form class="roomForm" id="joinForm" action="/join" method="post" style="display: flex;">`)
                    .replace(`<div class="error-msg" style="display: none;">Incorrect room name!</div>`, `<div class="error-msg" style="display: block;">Incorrect room name!</div>`);

                res.send(updatedErrorHml);
            });
            return;
            //abort password checking 
        }

        if (roomsList[roomName].password === password) {
            fs.readFile(path.join(__dirname, "msg.html"), "utf8", (err, data) => {
                if (err) {
                    console.log("At password check, not correct /join");
                    console.log(err);
                    return res.status(500).send('An error occured at the server, please try again after some time \nIf the problem persists , contact me at ...');
                }

                const updatedMsgHTML = data.replace(`roomName: "emledu"`, `roomName: "${roomName}"`)
                    .replace(`password: "emledu"`, `password: "${password}"`);

                res.send(updatedMsgHTML);
            });

            return;
            //abort sending error msg
        }

        fs.readFile(path.join(__dirname, "index.html"), "utf8", (err, data) => {
            if (err) {
                console.log("At password check /join");
                console.log(err);
                return res.status(500).send('An error occured at the server, please try again after some time \nIf the problem persists , contact me at ...');
            }

            const updatedErrorHml = data.replace(`<div id="appDetails" style="display: block;">`, `<div id="appDetails" style="display: none;">`)
                .replace(`<form class="roomForm" id="joinForm" action="/join" method="post" style="display: none;">`, `<form class="roomForm" id="joinForm" action="/join" method="post" style="display: flex;">`)
                .replace(`<div class="error-msg" style="display: none;">Incorrect password!</div>`, `<div class="error-msg" style="display: block;">Incorrect password!</div>`);

            res.send(updatedErrorHml);
        });
    });

    app.get("/music", (req, res) => {
        res.redirect('https://developerkaku.github.io/spotify-look-alike/');
    });

    const names = new Object();

    io.on("connection", async (socket) => {
        let userName = socket.handshake.auth.userName;
        let roomName = socket.handshake.auth.roomName;
        let password = socket.handshake.auth.password; // Not really usefull

        socket.join(roomName);
        console.log(userName, roomName);

        //creating the room table..
        await db.exec(
            `CREATE TABLE IF NOT EXISTS ${roomName}(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT,
            user_name TEXT);`
        );

        //emiting msg that user `name` connected
        io.to(roomName).emit("connectionMsg", "joined", userName);

        socket.on("chat message", async (msg) => {
            let result;
            try {
                //storing the msgs into the db
                result = await db.run(`INSERT INTO ${roomName} (content, user_name) VALUES (?, ?)`, msg, userName);
            } catch (e) {
                //errors,  duh !
                console.log("error aya bro " + result + " e: " + e.message);
                return;
            }

            io.to(roomName).emit("chat message", userName, msg, result.lastID);
        });

        if (!socket.recovered) {
            // if the connection sate recovery was not successful
            try {
                await db.each(`SELECT id, content, user_name FROM ${roomName} WHERE id > ?`,
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit('chat message', row.user_name, row.content, row.id);
                    }
                );
            } catch (e) {
                //error !
            }
        }

        //users typing events
        socket.on("typingEvent", (event) => {
            socket.broadcast.to(roomName).emit("typingEvent", event, userName);
            // socket.broadcast.emit("typingEvent", event, userName);
        })

        socket.on("disconnect", (reason) => {
            console.log("user disconnected " + userName);
            console.log("reason: " + reason);

            io.to(roomName).emit("connectionMsg", "disconnected", userName);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log("YO !!!! ");
    });

}

main();