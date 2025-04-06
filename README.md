Voice-Enabled Chat Page with LLM Integration

This project is a browser-based Chat Page that takes voice inputs from users, which are transcribed and processed through a Large Language Model (LLM) to generate human-like responses. It replies via both text and speech, creating a natural and accessible conversation experience.


🚀 Features

•	Voice input using the browser's Speech Recognition API

•	AI responses powered by Google Gemini LLM (Gemini 2.0 Flash)

•	Text-to-speech output using Web Speech Synthesis API

•	Keyboard support with Enter to send messages and multiline text input


🛠️ Technologies Used

🔊 Web Speech API

•	SpeechRecognition: Captures and transcribes voice input into text.

•	SpeechSynthesis: Reads out chatbot responses for a conversational feel.


🌐 HTML + CSS + JavaScript
•	Pure frontend implementation for handling DOM interaction, chat interface, and user input/output handling.


🧠 Gemini LLM (Google AI)

•	Uses Gemini 2.0 Flash API to send user messages and receive intelligent responses.

•	Communication is handled via fetch() with POST requests to the API.

💡 How It Works
1.	User speaks into the microphone.
2.	SpeechRecognition API converts the spoken input to text.
3.	The text is sent to Gemini API, which returns a response.
4.	The response is shown in the chat window and read out using SpeechSynthesis.
