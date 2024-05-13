module.exports = {
  attributes: {
  	name: {type: "string", defaultsTo: "Support"}, // Name of agent
    title: {type: "string", defaultsTo: "Support"}, // Work title of agent
    role: {type: "string", defaultsTo: "Assistant"}, // Role of agent
    sPrompt: {type: "string", defaultsTo: "You are jolly chatbot who answers user question in way a to bring smile on their face. You have ability to chat in any language of the world."}, //System Prompt
    iPrompt: {type: "string", defaultsTo: "{UserInput}"}, //Input prompt
    iPromptKeys: {type: "json", defaultsTo: {}}, // Input prompt keys
    oPromptKeys: {type: "json", defaultsTo: ["bot-answer"]}, //Output prompt keys
    chatKey: {type: "string", defaultsTo: "answer"},
    avatar: {type: "string"}
  },
};