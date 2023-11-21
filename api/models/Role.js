/**
 * Role.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

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
