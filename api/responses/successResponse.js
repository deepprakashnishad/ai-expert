/**
 * api/responses/successResponse.js
 *
 * This will be available in controllers as res.successResponse('foo');
 */

module.exports = function(data, statusCode, viewFilePath, success, msg) {

  var req = this.req;
  var res = this.res;

  // Optional message
  if (data) {
    result = data;
  }

  if(success){
    result.success = success;
  }

  if(statusCode >= 400){
    result.success = false;
  }

  if(req.method==="OPTIONS"){
    res.set('Access-Control-Max-Age', '2592000');
  }

  if(msg){
    result.msg = msg;
  }

  // If the user-agent wants a JSON response, send json
  if (req.wantsJSON) {
    return res.status(statusCode).json(result);
  }

  // Set status code and view locals
  res.status(statusCode);
  for (var key in result) {
    res.locals[key] = result[key];
  }
  // And render view
  res.render(viewFilePath, result, function(err) {
    // If the view doesn't exist, or an error occured, send json
    if (err) {
      return res.status(result.status).json(result);
    }

    // Otherwise, serve the `views/mySpecialView.*` page
    res.render(viewFilePath);
  });
}