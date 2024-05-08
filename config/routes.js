/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },
  '/dashboard': { view: 'pages/dashboard' },


  'POST /ai/textCompletion': { controller: 'ChatGPT', action: "callTextCompletions" },
  'POST /ai/createEmbeddings': { controller: 'ChatGPT', action: "createEmbeddings" },
  'POST /ai/customAIReply': { controller: 'ChatGPT', action: "customAIReply" },
  'POST /ai/translateQuestionInHtml': { controller: 'ChatGPT', action: "translateQuestionInHtml" },
  'POST /ai/genStrengthWeakness': { controller: 'ChatGPT', action: "genStrengthWeakness" },
  'POST /ai/dataCollector': { controller: 'ChatGPT', action: "dataCollector" },
  'POST /ai/technicalAnalysis': { controller: 'ChatGPT', action: "technicalAnalysis" },
  'POST /ai/softwareEngg': { controller: 'ChatGPT', action: "softwareEngg" },
  'POST /ai/softwareDeveloper': { controller: 'ChatGPT', action: "softwareDeveloper" },


  'POST /document/webScrapper': { controller: 'DocumentBuilder', action: "webScrapper" },
  'POST /document/pdfScrapper': { controller: 'DocumentBuilder', action: "pdfScrapper" },
  'POST /document/uploadFile': { controller: 'DocumentBuilder', action: "uploadFile" },

  'POST /RocketChat': { controller: 'RocketChat', action: "recieveUserMessage"},
  'POST /RocketChat/authenticate': { controller: 'RocketChat', action: "authenticate"},

  'POST /Agent': { controller: 'Agent', action: "create"},
  'PATCH /Agent': { controller: 'Agent', action: "update"},
  'GET /Agent/:id': { controller: 'Agent', action: "list"},
  'GET /Agent': { controller: 'Agent', action: "get"},
  'DELETE /Agent/:id': { controller: 'Agent', action: "delete"},

  'GET /Generic/wake-up': {controller: "Generic", action:"wakeUp"},
  'POST /Generic/wake-up': {controller: "Generic", action:"wakeUp"},


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
