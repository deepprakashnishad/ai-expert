const host = "http://localhost:1337/";
// const host = "http://ec2-3-15-23-46.us-east-2.compute.amazonaws.com:1337/";
// const host = "https://ai-expert.onrender.com/";


const chatGptTextCompletion = "ai/textCompletion";

const customAIReplyEndpoint = "agent/langGraphChat";

const chatbotConversation = document.getElementById('chatbot-conversation')

const sendIcon = document.getElementById('send-btn-icon');

const loaderIcon = document.getElementById('loader-btn-icon');

const chatMainContainer = document.getElementById('chat-main-container');

const chatBtn = document.getElementById('chat-btn');

document.getElementById('frm-submit-btn').addEventListener('click', submitForm);

var selectedChatId = undefined;

var mInterval = -1;

var formDataObj = {};    // ccc

var agentId = "Info Teller";

if(!agentId){
	alert("Agent Id not set");
}

var appId = "5";

if(!appId){
	alert("App Id not set");
}else{
	formDataObj['appId'] = appId;
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

		scrollToBottomOfDiv('chatbot-conversation');  //////

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
    let i = 0;
    if(mInterval==-1){
    	newSpeechBubble.innerHTML = text;
    	chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }else{
    	newSpeechBubble.classList.add('blinking-cursor');
    	const interval = setInterval(() => {
		    newSpeechBubble.innerHTML += text.slice(i-1, i)
		    if (text.length === i) {
		        clearInterval(interval)
		        newSpeechBubble.classList.remove('blinking-cursor')
		        newSpeechBubble.innerHTML = text;
		    }
		    i++
		    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
		}, mInterval);
    }

	
	scrollToBottomOfDiv('chatbot-conversation');   
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
					"chatId": selectedChatId,
					"user": formDataObj // Include form data here
				})
			}
		);
		var result = await response.json();

		if(result.success){
			selectedChatId = result.chatId; 
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

function scrollToBottomOfDiv(divId) {
    var div = document.getElementById(divId);
    div.scrollTop = div.scrollHeight;
}

function submitForm(event) {
	event.preventDefault(); // Prevent default form submission

	// Get form data
	var inputUserName = document.getElementById('username');
	var inputUserEmail = document.getElementById('useremail');

	formDataObj['name'] = inputUserName.value;
	formDataObj['email'] = inputUserEmail.value;
	// Example: Send formDataObj to the backend for storage in a table
	// Replace this with your actual backend endpoint or database operation
	console.log('Form data:', formDataObj);

	inputUserName.value = ""
	inputUserName.value = "";

	// Hide the form after submission
	document.getElementById('form').style.display = 'none';

	// Enable chat input and send button
    document.getElementById('user-input').disabled = false;
    document.getElementById('submit-btn').disabled = false;
}
