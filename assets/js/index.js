// const host = "http://localhost:1337/";
const host = "https://ai-expert.onrender.com/";

const chatGptTextCompletion = "ai/textCompletion";

const customAIReplyEndpoint = "ai/customAIReply";

const chatbotConversation = document.getElementById('chatbot-conversation')

const sendIcon = document.getElementById('send-btn-icon');

const loaderIcon = document.getElementById('loader-btn-icon');

const chatMainContainer = document.getElementById('chat-main-container');

const chatBtn = document.getElementById('chat-btn');

var messages = [{
	"role": "system",
	"content": "You are a chatbot who can chat in world's any language and helps people with their queries based on previous messages and information provided inside triple hash only. You reply to the question provided in triple backticks in context of conversation. If are not sure of the answer from the information provided simply say I don't know."
}];

document.getElementById("submit-btn").addEventListener("click", (e)=>{
	userInputSubmitted();
});

document.getElementById("user-input").addEventListener("keypress", (e)=>{
	if(e.key==="Enter"){
		userInputSubmitted();
	}
});

chatBtn.addEventListener("click", (e)=>{
	chatBtn.classList.add("hidden");
	chatMainContainer.classList.remove("hidden");
});

document.getElementById("close-btn").addEventListener("click", (e)=>{
	chatBtn.classList.remove("hidden");
	chatMainContainer.classList.add("hidden");
});


function userInputSubmitted(){
	const userInput = document.getElementById('user-input');
    messages.push({"role": "user", "content": userInput.value});
    addNewBubble("user", userInput.value);
    userInput.value = "";
    toggleLoaderSendDisplay(true);
	fetchBotReply(messages).then(response=>{
		toggleLoaderSendDisplay(false);
		if(response[0] && response[0].message){
			messages.push(response[0].message);
			window.parent.postMessage({data: response[0].message}, "*");
		}
		addNewBubble(response[0].message.role, response[0].message.content);
	}).catch((err)=>{
		console.log(err);
		toggleLoaderSendDisplay(false);
	});
}

function addNewBubble(role, text){
	const newSpeechBubble = document.createElement('div')
	if(role==="user"){
		newSpeechBubble.classList.add('speech', 'speech-human');
	}else if(role==="assistant"){
		newSpeechBubble.classList.add('speech', 'speech-ai')
	}
    chatbotConversation.appendChild(newSpeechBubble);

    newSpeechBubble.classList.add('blinking-cursor');
    let i = 0;
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i-1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 20);
}

async function fetchBotReply(messages) {
	try{
		const response = await fetch(
			host + customAIReplyEndpoint,
			{
				method: 'POST',
				headers: {
					"Content-Type": "application/json"
				},
				mode:"cors",
				cache: "no-cache",
				body: JSON.stringify({
					"messages": messages
				})
			}
		);
		var result = await response.json();

		if(result.success){
			return result.data;
		}else{
			toggleLoaderSendDisplay(false);
		}
	  	return data;
	}catch(err){
		console.log(err);
		toggleLoaderSendDisplay(false);
	}
}

function toggleLoaderSendDisplay(isShowLoader){
	if(isShowLoader){
		sendIcon.classList.add('hidden');
		loaderIcon.classList.remove('hidden');

		sendIcon.classList.remove('show');
		loaderIcon.classList.add('show');
	}else{
		sendIcon.classList.remove('hidden');
		loaderIcon.classList.add('hidden');

		sendIcon.classList.add('show');
		loaderIcon.classList.remove('show');
	}
}