/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // sendgridSecret: 'SG.fake.3e0Bn0qSQVnwb1E4qNPz9JZP5vLZYqjh7sn8S93oSHU',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …


  OPEN_API_KEY: "sk-proj-8WaEQhgL6c2OuV78b17KT3BlbkFJT9MhR2DXCjdbKlonFeqh",//"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",

  BARD_API_KEY: "AIzaSyA0Dx2UQg7tCSs3Uj9EITO4k1njcgBpYig",

  ROCKET_CHAT: {

    USERNAME: "deepnishad",

    PASSWORD: 'nsNbtK7"wV5GPs]',

    BASE_URL: "http://localhost:3000",

    AUTH_URL: "/api/v1/login",
    
    MSG_HOOK: "/hooks/65fce148b3ca20e5728e4720/BjFvbpJRwPsQPknkbfKAgSckrEJJDbuxgMe6x8C5wR9ZC87q",

    SEND_MSG: "/api/v1/chat.sendMessage",
  }
};
