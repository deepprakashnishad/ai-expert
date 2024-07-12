// const host = "http://localhost:1337/";
const host = "http://ec2-3-22-209-20.us-east-2.compute.amazonaws.com:1337/";

const chatGptTextCompletion = "ai/textCompletion";

const customAIReplyEndpoint = "agent/langGraphChat";

const chatbotConversation = document.getElementById('chatbot-conversation')

const sendIcon = document.getElementById('send-btn-icon');

const loaderIcon = document.getElementById('loader-btn-icon');

const chatMainContainer = document.getElementById('chat-main-container');

const chatBtn = document.getElementById('chat-btn');

var selectedChatId = undefined;

var agentId = "Info Teller";

if(!agentId){
	console.log("Agent not set");
}

var messages = [];

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
    var message = userInput.value;
    addNewBubble("user", message);
    userInput.value = "";
    toggleLoaderSendDisplay(true);
	fetchBotReply(message).then(response=>{
		toggleLoaderSendDisplay(false);
		console.log(response);
		var serverMessage = typeof response === "string" ? response : JSON.stringify(response);
		console.log(`Server Message - ${serverMessage}`);
		if(serverMessage){
			messages.push(serverMessage);
			window.parent.postMessage({data: serverMessage}, "*");
		}

		addNewBubble("assistant", serverMessage);
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
        newSpeechBubble.innerHTML += text.slice(i-1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
            newSpeechBubble.innerHTML = text;
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 10);
}

async function fetchBotReply(message) {
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
					"userInput": message,
					"agentId": agentId,
					"chatId": selectedChatId
				})
			}
		);
		var result = await response.json();

		if(result.success){
			selectedChatId = result.chatId; 
			console.log(result);
			console.log(result.result);
			return result.result;
		}else{
			toggleLoaderSendDisplay(false);
		}
	  	return result;
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