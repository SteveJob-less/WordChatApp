import express from "express"
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import WordChatGame from "./socketWordChatGame.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const port = 4321;
const app = express();
const serverPort = app.listen(port, () => console.log(`Server Port: ${port}`));
const io = new Server(serverPort);
const WordChatServer = new WordChatGame();

io.on("connection", (socket) => WordChatServer.socketConnect(socket))

app.set("view engine", "ejs");
app.get("/element-interactions.js", (req, res) => {
    res.sendFile(`${__dirname}/public/js/element-interactions.js`);
});
app.get("/ss.png", (req, res) => {
    res.sendFile(`${__dirname}/public/screenshots/ss.png`);
});
app.get("/ss2.png", (req, res) => {
    res.sendFile(`${__dirname}/public/screenshots/ss2.png`);
});
app.get("/", (req, res) => {
    const { users, difficulty, word } = WordChatServer.getGameData(); // To initial load the current game data when client connects

    res.render("index", { users, difficulty, word });
});