module.exports = {
  attributes: {
    title: {type: "string", required: true}, // Name of agent
    role: {type: "string", required: true}, // Role of agent
    sPrompt: {type: "string"},
  },
};