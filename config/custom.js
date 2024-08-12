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
  //

  baseUrl: "http://localhost:1337",

  OPEN_API_KEY: "sk-proj-8WaEQhgL6c2OuV78b17KT3BlbkFJT9MhR2DXCjdbKlonFeqh",//"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",

  BARD_API_KEY: "AIzaSyA0Dx2UQg7tCSs3Uj9EITO4k1njcgBpYig",

  PINECONE_API_KEY: "c547ff1d-b710-4887-8d7b-5449be71c4a7",

  RAGDOC: "55Ggb3N3rYT4GdUb370qJmH1Nlfm_o169Udjjjl6ESSZRn1tW4hUzg",

  /*SQL_DB:{
    user: 'postgres',
    host: 'ecpms.cbsugemiw2rk.us-east-2.rds.amazonaws.com',
    database: 'ecpms',
    password: 'A2mw0bdod#1',
    port: 5432, // default PostgreSQL port
  },*/

  SQL_DB:{
    user: 'demo',
    host: 'localhost',
    database: 'ecmps',
    password: 'demo',
    port: 5432, // default PostgreSQL port
  },

  // ODOO: {
  //   host: 'localhost',
  //   port: 8069,
  //   db: 'ecmps',
  //   username: 'admin',
  //   password: 'admin'
  // },

  ODOO: {
    https: true,
    host: 'odoo-164786-0.cloudclusters.net',
    db: 'eCPMS',
    username: 'vipin@astratechsystems.com',
    password: 't0cCmj7x'
  },

  ROCKET_CHAT: {

    USERNAME: "deepnishad",

    PASSWORD: 'nsNbtK7"wV5GPs]',

    BASE_URL: "http://localhost:3000",

    AUTH_URL: "/api/v1/login",
    
    MSG_HOOK: "/hooks/65fce148b3ca20e5728e4720/BjFvbpJRwPsQPknkbfKAgSckrEJJDbuxgMe6x8C5wR9ZC87q",

    SEND_MSG: "/api/v1/chat.sendMessage",
  }
};
