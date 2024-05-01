module.exports = {
  attributes: {
    title: {type: "string", required: true}, // Name of agent
    role: {model: "Person", required: true}, // Role of agent
    sPrompt: {type: "string"},
  },
};