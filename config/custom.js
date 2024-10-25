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

  // SQL_DB:{
  //   dbType: "mysql",
  //   user: 'sql12725872',
  //   host: 'sql12.freesqldatabase.com',
  //   database: 'sql12725872',
  //   password: 'Xf2UVZYtmS',
  //   port: 3306, // default PostgreSQL port
  // },

  GOOGLE: {
    CLIENT_ID: "963508048830-1n1sgll8ufmpon9gg8ul44gm37rjnolj.apps.googleusercontent.com",
    CLIENT_SECRET: "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",
  },

  SQL_DB:{
    dbType: "postgres",
    user: 'odoo',
    host: 'localhost',
    database: 'ecpms-prod',
    password: 'pass',
    port: 5432, // default PostgreSQL port
  },

  // postgresql://demo123:GuVym45v3yt2Uss53IwLzyHuU9qd3Y06@dpg-cqu9i4jv2p9s73d3mtdg-a.singapore-postgres.render.com/testdb_2wby
  /*SQL_DB:{
    dbType: "postgres",
    user: 'demo123',
    host: 'dpg-cqu9i4jv2p9s73d3mtdg-a.singapore-postgres.render.com',
    database: 'testdb_2wby',
    password: 'GuVym45v3yt2Uss53IwLzyHuU9qd3Y06',
    port: 5432, // default PostgreSQL port
    is_ssl: true
  },*/

  /*ODOO: {
    host: 'localhost',
    port: 8069,
    db: 'ecmps',
    username: 'admin',
    password: 'admin'
  },*/

  /*ODOO: {
    https: true,
    host: 'odoo-164786-0.cloudclusters.net',
    db: 'eCPMS',
    username: 'vipin@astratechsystems.com',
    password: 't0cCmj7x'
  },*/

  ODOO: {
    https: true,
    host: 'odoo-171419-0.cloudclusters.net',
    db: 'admin',
    username: 'vipin@astratechsystems.com',
    password: 'C7n20RxR'
  },

  SHOPIFY: {
    shop_name: "6cdc10-40",

    admin_token: "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",

    store_token: "81a53db4b8b9d2840d8c445c486a9bdb",

    api_key: "33a12bf566722a928ad9e777d51ac463",

    api_secret_key: "d7b3305c15a02b90f9b6fbac2122b7b6"
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
