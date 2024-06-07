Tool

POST

mandatory fields
name: String,
description: string
type: string [api]

parameters based on type

Type = "api"

api_name: string
api_url: string
method: string
required_parameters: [{name: string, type: string, description: string, default: string}]
optional_parameters: [{name: string, type: string, description: string, default: string}]
template_response: []

Example: 

  {
    "tool_name": "Zipwhip",
    "api_name": "* user/login",
    "api_description": "Takes a username and password and returns json with the account's session key. A sessionkey lasts forever, so it is best to store the sessionkey and use it for future purposes.",
    "required_parameters": [
      {
        "name": "username",
        "type": "STRING",
        "description": "For US domestic use 10-digit number. For International numbers use full E.164 format. Examples: US: 5555555555 E.164: +1155555555555",
        "default": ""
      },
      {
        "name": "password",
        "type": "STRING",
        "description": "Password associated with phone number being entered in user/login.",
        "default": ""
      }
    ],
    "optional_parameters": [],
    "method": "GET",
    "template_response": {
      "sessions": "NoneType",
      "success": "bool",
      "response": "str"
    },
    "api_url": "https://community-zipwhip.p.rapidapi.com/user/login"
  },

  