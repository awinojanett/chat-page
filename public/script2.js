// DOM Elements
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const chatbox = document.querySelector(".chatbox");
const voiceButton = document.querySelector("#voice-input-btn");

// State variables
let userMessage = "";
const inputInitHeight = chatInput.scrollHeight;

// Initialize chatbot as visible by default
document.body.classList.add("show-chatbot");

// Text-to-Speech (TTS) setup
const synth = window.speechSynthesis;

// Speech Recognition Setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-GB";
recognition.continuous = false;
recognition.interimResults = false;

// Gemini API Configuration
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyCKEWMetR__IcsXTuNrKFRMQxJUKtdvQcY";

// Function to create chat messages
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing"
        ? `<p></p>`
        : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
};

// Function to make the chatbot speak
const speakResponse = (message) => {
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    synth.speak(utterance);
};

// Gemini-based response generation
const generateResponse = async (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector("p");

    try {
        const prompt = userMessage;

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (botResponse) {
            messageElement.textContent = botResponse;
            speakResponse(botResponse);
        } else {
            throw new Error("No response from Gemini API");
        }
    } catch (error) {
        console.error("Error:", error);
        messageElement.textContent = "⚠️ I couldn't process your request. Please try again.";
        speakResponse(messageElement.textContent);
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
};

// Handle chat input
const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    const outgoingChatLi = createChatLi(userMessage, "outgoing");
    chatbox.appendChild(outgoingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        const incomingChatLi = createChatLi("Analyzing...", "incoming");
        chatbox.appendChild(incomingChatLi);
        generateResponse(incomingChatLi);
    }, 600);
};

// Adjust textarea height dynamically
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Send message on button click
sendChatBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleChat();
});

// Send message on Enter key
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});

// Chat toggle functionality
chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot");

    const icon1 = chatbotToggler.querySelector(".material-symbols-rounded");
    const icon2 = chatbotToggler.querySelector(".material-symbols-outlined");
    icon1.style.display = document.body.classList.contains("show-chatbot") ? "none" : "block";
    icon2.style.display = document.body.classList.contains("show-chatbot") ? "block" : "none";
});

// Close button functionality
closeBtn.addEventListener("click", () => {
    document.body.classList.remove("show-chatbot");

    const icon1 = chatbotToggler.querySelector(".material-symbols-rounded");
    const icon2 = chatbotToggler.querySelector(".material-symbols-outlined");
    icon1.style.display = "block";
    icon2.style.display = "none";
});

// Voice input functionality
voiceButton.addEventListener("click", () => {
    recognition.start();
});

recognition.onresult = (event) => {
    userMessage = event.results[0][0].transcript;
    chatInput.value = userMessage;
    handleChat();
};

recognition.onerror = (event) => {
    console.error("Speech Recognition Error: ", event.error);
    const errorChatLi = createChatLi("Voice input failed. Please try again.", "incoming");
    chatbox.appendChild(errorChatLi);
    speakResponse("Sorry, I didn't catch that. Please try speaking again.");
};

// Initialize button icons
const icon1 = chatbotToggler.querySelector(".material-symbols-rounded");
const icon2 = chatbotToggler.querySelector(".material-symbols-outlined");
icon1.style.display = "block";
icon2.style.display = "none";
