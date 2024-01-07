// TO REFACTOR: separate the functions for dom and socket interactions, add minimal animation and styling
$(document).ready(() => { 
    const submitBtn = document.getElementById("submit");
    const inputElement = document.getElementById("chat-input");
    const chatBoxElement = document.getElementById("chat-box");

    const socket = io(); 
    let name = localStorage.getItem("name");

    if (!name) name = prompt("Enter your name :");

    socket.on("input-name", () => { 
        if (name) {
            socket.emit("set-name", { name });
            displayName(name);
        }

        if(!name) alert("PLEASE INPUT NAME");
    });

    socket.on("send-userData", (data) => {
        localStorage.setItem("name", data.name);
        localStorage.setItem("id", JSON.stringify(data.id));
    });

    socket.on("load-game", (data) => {
        inputElement.value = "";
        
        appendConversation(data.convo);
        appendUsers(data.users); 
        updateToGuessWord(data.word.toAnswer);  
        updateDifficultyLevel(data.difficulty); 
    });

    socket.on("rerender-user-list", (data) => {
        appendUsers(data.users);
    });

    socket.on("update-word", (data) => {
        updateToGuessWord(data.word);
        appendUsers(data.users);
        updateConversation(data.prompt);
        updateConversation(data.winner);
        updateDifficultyLevel(data.difficulty);
    });

    socket.on("update-own-chatbox", (data) => {
        if (data.answer) console.log("Answer:", data.answer);
        updateConversation(data.prompt);
    });

    socket.on("update-other-chatbox", (data) => {
        updateConversation(data.prompt);
    });

    socket.on("update-all-chatbox", (data) => {
        updateConversation(data.prompt);
    });

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const text = inputElement.value;
        inputElement.value = "";

        if (name && text) socket.emit("send-chat", { name, chat: text }); 
        if (!name) alert("YOU NEED TO INPUT YOUR NAME FIRST");
    });

    function displayName(name) {
        const namePlaceholder = document.getElementById("name");
        namePlaceholder.textContent = name;
    }

    function appendUsers(users) {
        const userContainerElement = document.getElementById("user-container");
        userContainerElement.innerHTML = "";

        for (const userId in users) {
            const user = users[userId];

            const userElement = document.createElement("p");
            const styles = ["w-[158px]", "font-bold", "text-2xl"];

            userElement.classList.add(...styles);
            userElement.textContent = `• ${user.name} - ${user.score}`;
            userContainerElement.appendChild(userElement);
        };
    }

    function appendConversation(convo) {
        convo.forEach((message) => {
            appendMessage(message);
        });
    }
      
    function updateConversation(message) {
        appendMessage(message);
    }
    
    function appendMessage(message) {
        const messageElement = document.createElement("p");
        messageElement.classList.add("text-xl");
        messageElement.textContent = message;
        chatBoxElement.appendChild(messageElement);
        chatBoxElement.scrollTop = chatBoxElement.scrollHeight; // Auto-scroll
    }

    function updateToGuessWord(word) {
        const guessWordElement = document.getElementById("guess-word");
        guessWordElement.textContent = "";
        guessWordElement.textContent = word;
    }

    function updateDifficultyLevel(level) {
        const difficultyPlaceholderElement = document.getElementById("difficulty-placeholder");
        difficultyPlaceholderElement.textContent = "";
        difficultyPlaceholderElement.textContent = level;
    }
});