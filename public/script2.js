// DOM Elements
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const chatbox = document.querySelector(".chatbox");
const voiceButton = document.querySelector("#voice-input-btn");
const fileUploadBtn = document.querySelector("#file-upload-btn");
const fileInput = document.querySelector("#file-input");

// State variables
let userMessage = "";
const inputInitHeight = chatInput.scrollHeight;
let uploadedFileContent = "";
let currentFileName = "";

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
    if (synth.speaking) {
        synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    synth.speak(utterance);
};

// Enhanced document processing with progress tracking
const extractTextFromFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                let textContent = "";
                currentFileName = file.name;

                if (file.type === "application/pdf") {
                    const typedArray = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;

                    let fullText = "";
                    const maxPages = Math.min(pdf.numPages, 15);

                    const processingMsg = createChatLi(`Processing ${file.name} (page 1 of ${maxPages})...`, "incoming");
                    chatbox.appendChild(processingMsg);
                    chatbox.scrollTo(0, chatbox.scrollHeight);

                    for (let i = 1; i <= maxPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();

                        fullText += `PAGE ${i}:\n${pageText}\n\n`;

                        if (i % 3 === 0) {
                            processingMsg.querySelector("p").textContent =
                                `Processing ${file.name} (page ${i} of ${maxPages})...`;
                        }
                    }

                    chatbox.removeChild(processingMsg);

                    if (!fullText.trim()) {
                        throw new Error("The PDF appears to be scanned or contains no extractable text");
                    }

                    textContent = fullText;
                } else if (file.type.includes("text") || file.type.includes("csv")) {
                    textContent = event.target.result
                        .replace(/\s+/g, ' ')
                        .trim();
                } else {
                    throw new Error("Unsupported file type");
                }

                resolve(textContent);
            } catch (error) {
                console.error("Error processing file:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);

        if (file.type === "application/pdf") {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
};

// Gemini-based response generation
const generateResponse = async (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector("p");

    try {
        let prompt = "";
        const documentContext = uploadedFileContent.substring(0, 20000)
            .replace(/(\r\n|\n|\r)/gm, " ")
            .replace(/\s+/g, ' ');

        if (uploadedFileContent) {
            prompt = `
DOCUMENT ANALYSIS INSTRUCTIONS:
You are analyzing "${currentFileName}". Provide detailed answers based on the content.

CONTENT:
${documentContext}

GUIDELINES:
1. For summary requests, extract 3-5 key bullet points
2. For "what is this about" questions, explain the main purpose
3. For specific questions, provide precise answers with page references if available
4. If answer isn't found, explain why clearly
5. Format responses professionally with clear structure

USER QUERY:
${userMessage}`.trim();
        } else {
            prompt = userMessage;
        }

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
            let fullResponse = botResponse;
            if (uploadedFileContent) {
                fullResponse += `\n\n[Analysis of ${currentFileName}]`;
            }

            messageElement.textContent = fullResponse;
            speakResponse(fullResponse);
        } else {
            throw new Error("No response from Gemini API");
        }
    } catch (error) {
        console.error("Error:", error);
        messageElement.textContent = "⚠️ I couldn't analyze the document. Please try a different file or ask another question.";
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

// File upload handling
fileUploadBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const uploadingChatLi = createChatLi("Uploading and processing your document...", "incoming");
        chatbox.appendChild(uploadingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        const fileContent = await extractTextFromFile(file);
        uploadedFileContent = fileContent;

        uploadingChatLi.querySelector("p").textContent = `"${file.name}" ready for analysis! Ask me anything about it.`;
        speakResponse(`Document ${file.name} is ready for your questions.`);
    } catch (error) {
        console.error("Error processing file:", error);
        const errorMsg = error.message.includes("Unsupported file type") ?
            "Please upload a PDF or text file" :
            "Failed to process the document. Please try another file.";

        const errorChatLi = createChatLi(errorMsg, "incoming");
        chatbox.appendChild(errorChatLi);
        speakResponse(errorMsg);
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
