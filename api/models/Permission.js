/**
 * Permission.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    permission: {
        type: "String",
        required: true,
        unique: true,
        minLength: 2
    },
    description:{
        type: "String"
    },
    persons: {
        collection: "person",
        via: "permissions"
    },
    roles:{
        collection: "role",
        via: "permissions"
    }
  },

};