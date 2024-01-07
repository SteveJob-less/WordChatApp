export default class WordChatGame {
    constructor() {
        this.connectedUsers = {};
        this.user;
        this.convo = [];
        this.difficulty = "Easy";
        this.word = {
            answer: "",
            toAnswer: "",
        }
    }

    socketConnect(socket) {

        // Initial load send the game data to client
        // Ask to input name
        socket.emit("input-name", () => this.loadGameData());

        // Proceed to handleUserJoin (add user to this.connectedUsers with their unique socket.id);
        socket.on("set-name", (data) => {
            console.log(`set-name:  ${data.name} -> push to server's users array`);
            
            this.handleUserJoin(socket, data);
        });

        // Handles the messaging, Generate prompts for each side of user, save user chat in this.convo
        socket.on("send-chat", (data) => {
            const promptToOthers = `${data.name}: ${data.chat}`;
            const promptToSelf = `You: ${data.chat}`;

            saveText(promptToOthers, this.convo);

            const parsedData = parseForAnswer(data.name, data.chat, this.word.answer);
            
            // TRUE: Generate Congrats Prompt, Save prompt to this.convo 
            // Add user score, then proceed to handleCorrectAnswer();
            // False: Simply update all clients chatbox
            if (parsedData) {
                saveText(parsedData.prompt, this.convo);

                this.changeDifficultyLevel();
                this.connectedUsers[socket.id].score++;
                this.handleCorrectAnswer(socket, { 
                    self: promptToSelf, 
                    others: promptToOthers, 
                    wonPrompt: parsedData.prompt 
                });
            } else {
                this.handleUpdateChatBox(socket, { 
                    self: promptToSelf, 
                    others: promptToOthers,
                    answer: this.word.answer,
                });
            }
        });

        socket.on("disconnect", () => {
            this.handleUserDisconnect(socket);
        });
    }

    // Generate prompt for user disconnection, and save to inbox 
    // Delete the user from the this.usersConnected
    // Update the clients user list with the disconnection prompt
    handleUserDisconnect(socket) {
        try {
            const disconnectedUser = this.connectedUsers[socket.id];
            const text = `${disconnectedUser.name} left the game.`;
            saveText(text, this.convo);
            console.log(`handleDisconnect(); ${text}`);

            delete this.connectedUsers[socket.id];
            socket.broadcast.emit("rerender-user-list", { users: this.connectedUsers });
            socket.broadcast.emit("update-other-chatbox", { prompt: text });
        } catch (err) {
            console.error(err)
            console.warn("User already removed from connectedUsers");
        }
    }

    // Regenerate a new word, update all users chatbox and user list
    handleCorrectAnswer(socket, data) {
        this.handleGetARandomWord();

        socket.broadcast.emit("update-word", { 
            users: this.connectedUsers, 
            word: this.word.toAnswer, 
            prompt: data.others, 
            winner: data.wonPrompt,
            difficulty: this.difficulty,
        });

        socket.emit("update-word", { 
            users: this.connectedUsers, 
            word: this.word.toAnswer, 
            prompt: data.self, 
            winner: data.wonPrompt,
            difficulty: this.difficulty,
        });
    }

    // Generate prompts, Adds a user, Fetch a random word
    // Load the game and update chatbox
    handleUserJoin(socket, data) {
        const text = `${data.name} joined the game.`;

        this.connectedUsers[socket.id] = { name: data.name, score: 0 };   // add the new user to the server
        
        // Initially generate random word when a user connects to the server
        if (Object.keys(this.connectedUsers).length === 1) this.handleGetARandomWord();
        
        this.loadGameData(socket);
        this.handleUpdateChatBox(socket, { self: "You joined the game", others: text });
        this.convo.push(text);

        socket.emit("send-userData", { name: data.name, id: socket.id });
        socket.broadcast.emit("rerender-user-list", { users: this.connectedUsers });
    }

    // Handles the chatbox update to each users connected
    handleUpdateChatBox(socket, { self, others, answer }) {
        if (self) socket.emit("update-own-chatbox", { prompt: self, answer: answer });
        if (others) socket.broadcast.emit("update-other-chatbox", { prompt: others });
    }

    // Used external function to generate words
    handleGetARandomWord() {
        this.word.answer = generateRandomWord(this.difficulty);
        this.word.toAnswer = generateBlanks(this.word.answer);
    }

    // Load the game data to the client
    loadGameData(socket) {
        console.log("loadGameData: ", this.getGameData());

        socket.emit("load-game", this.getGameData());
    }

    // Returns the game data
    getGameData() {
        return { 
            users: this.connectedUsers, 
            difficulty: this.difficulty, 
            word: this.word,
            convo: this.convo,
        };
    }

    // To cycle through the diffculty levels
    changeDifficultyLevel() {
        const difficultyLevels = ["Easy", "Medium", "Hard"];
        this.difficulty = difficultyLevels[(difficultyLevels.indexOf(this.difficulty) + 1) % 3];
    }
}

// Save string to inbox, Mainly to record chat history
function saveText(text, container) {
    container.push(text);
}

// Function that returns random word base to its level input
function generateRandomWord(level) {
    const words = {
        Easy : ["apple", "chair", "laugh", "sing", "train", "flower", "clock", "happy", "pizza", "ocean", "window", "doctor", "movie", "school", "house"],
        Medium: ["rhythm", "whisper", "melody", "journey", "mystery", "sparkle", "umbrella", "compass", "lantern", "costume", "blizzard", "puzzle", "hammock", "willow"],
        Hard: ["xylophone", "chrysalis", "archipelago", "hieroglyph", "serendipity", "iridescent", "melancholic", "penultimate", "ephemerality", "bibliophile", "quixotic", "labyrinth", "cacophony", "prestidigitation"],
    }
    
    const arrayLength = words[level].length;
    const index = Math.floor(Math.random() * arrayLength);

    return words[level][index]; 
}

// Function to generate a blanked string
function generateBlanks(string) {
    const blankCount = Math.floor(string.length * 0.4);
    const chars = string.split(""); // Convert string to array of characters
  
    for (let i = 0; i < blankCount; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      chars[randomIndex] = "_"; // Replace random letter with underscore
    }
  
    return chars.join(""); // Join characters back into a string
}

// Function to parse string, returns prompt message when the string includes the correct answer
function parseForAnswer(sender, text, answer) { 
    if (text.match(new RegExp(`\\b${answer}\\b`, "i") || new RegExp(`\\b${answer}?\\b`, "i"))) {
        return { prompt: `Yehey ${sender} got the correct answer: "${answer}"`};
    }
}