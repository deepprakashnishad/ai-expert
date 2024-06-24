module.exports = {
  attributes: {
  	name: {type: "string", required: true}, // Name of agent
    title: {type: "string", required: true}, // Work title of agent
    role: {type: "string", required: true}, // Role of agent
    sPrompt: {type: "string", required: true}, //System Prompt
    iPrompt: {type: "string", defaultsTo: "{UserInput}"}, //Input prompt
    iPromptKeys: {type: "json", defaultsTo: {}}, // Input prompt keys
    oPromptKeys: {type: "json", defaultsTo: ["bot-answer"]}, //Output prompt keys
    chatKey: {type: "string", defaultsTo: "answer"},
    avatar: {type: "string"},
    tools: {collection: "Tool"}
  },
};