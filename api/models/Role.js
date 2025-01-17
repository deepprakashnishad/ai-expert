module.exports = {
  attributes: {
    name: {
        type: "String",
        unique: true,
        required: true
    },
    description:{
        type: "string"
    },
    permissions:{
        collection: "permission",
        via: "roles"
    }
  },

};
