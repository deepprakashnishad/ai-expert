/**
 * UserLogin.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    lt:{ //Login Type
        type: "String",
        isIn: ["Google", "Facebook", "MobileAuthentication", "Portal"],
        defaultsTo: "Portal"
    },
    t1:{ //Token 1
        type: "String"
    },
    t2:{ //Token 2
        type: "String"
    },
    e:{ //Email
        type:"String",
        isEmail: true,
        allowNull: true
    },
    m:{ //Mobile
        type:"string",
        unique: true,
    },
    p: { //Person
        model: "Person",
        required: true,
        unique: true
    },
    pass: { //Password
        type: "String",
        maxLength: 64,
        minLength: 4,
        allowNull: true
    },
    iid: { //Issuer unique Id
        type: "String",
        allowNull: true
    },
    iprr: { // Is password reset required
        type: "number",
        defaultsTo: 0  
    },
    cb: {
        model: "Person" //Created By
    }
  },
  
  beforeCreate: async function (valuesToSet, proceed) {
        if(valuesToSet.pass){
            const crypto = require('crypto');
            const hash = crypto.createHmac('sha256', sails.config.models.dataEncryptionKeys.passHashKey)
                           .update(valuesToSet.pass)
                           .digest('hex');
            valuesToSet.pass = hash;
        }
        if(valuesToSet.m.length==0){
            console.log("Could not create user");
          return null;
        }
        return proceed();
  },
  beforeUpdate: async function (valuesToSet, proceed) {
        if(valuesToSet.pass){
            const crypto = require('crypto');
            const hash = crypto.createHmac('sha256', sails.config.models.dataEncryptionKeys.passHashKey)
                           .update(valuesToSet.pass)
                           .digest('hex');
            valuesToSet.pass = hash;
        }
        if((valuesToSet.hasOwnProperty("m") && valuesToSet.m == null)){
          return null;
        }
        return proceed();
  },
};

