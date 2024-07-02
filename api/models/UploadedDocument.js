module.exports = {
  attributes: {
    title: {type: "string"},
    type:{type: "string", defaultsTo: "generic"},
    owner: {type: "string"},
    embeds: {collection: "CVector", via: "d"},
    clientId: {type: "string"},
    agent: {model: "Agent"}
  },
};