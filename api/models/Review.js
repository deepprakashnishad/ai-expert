module.exports = {
  attributes: {
  	chatId: {model: "ChatHistory"},
    name: {type: "string", required: true}, // Work title of agent
    email: {type: "string", required: true}, // Role of agent
    rating: {type: "number", required: true}, //System Prompt
    review: {type: "string"},
    appId: {type: "string", required: true}
  },
};