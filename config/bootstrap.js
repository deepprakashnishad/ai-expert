/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

var async = require('async');
var nodepath = require('path'), seedInfo;

const { MongoClient } = require("mongodb");


function hasSeedInfo() {
    var seedPath = nodepath.resolve(sails.config.paths.config, 'env', sails.config.environment, 'seed');
    try {
        seedInfo = require(seedPath)
    } catch (e) {}
    return !_.isUndefined(seedInfo) && !_.isNull(seedInfo);
}

function doSeed(callback) {
    var self = this;
    _.each(seedInfo, function(value, key) {
        var model = self[key];
        if (!_.isNull(model) && !_.isUndefined(model)) {
            model.count().exec(function(err, count) {
                if (!err && count === 0 && !_.isEmpty(value)) {
                    sails.log.debug('Seeding ' + key + '...');
                    model.createEach(value).exec(function(err, results) {
                        if (err) {
                            sails.log.debug(err);
                        } else {
                            sails.log.debug((key + ' seed planted').grey);
                        }
                    });
                } else {
                    sails.log.debug((key + ' had models, so no seed needed').grey);
                }
            });
        }
    });
    callback();
}

async function createFirstUserLogin(){
  if(await UserLogin.count()==0){
    var person = await Person.findOne({"m": "+917007788122"});
    if(person){
      let user = await UserLogin.create({"m": "+917007788122", "pass":"admin", "p": person.id, "lt": "Portal"}).fetch();
      sails.log.debug("User seed successfully planted. Following are details: ");
      sails.log.debug("Userid: "+person.mobile);
      sails.log.debug("Person: "+person.id);
    }else{
      sails.log.debug("Admin person does not exist hence skipping user login creation");
    }
  }else{
    sails.log.debug(("Admin user login exists hence skipping user login creation").grey);
  }
}

async function assignPermissionToRoles() {
  var roles = await Role.find().populate("permissions");
  for (var i = 0; i < roles.length; i++) {
    var role = roles[i];
    if(role.permissions.length==0){
      var permissions = [];
      sails.log.debug('Assigning permissions to role ' + role.name);
      if(role.name=="ADMIN"){
        permissions = await Permission.find();
      }

      await Role.addToCollection(role.id, "permissions").members(getPermissionIds(permissions));
    }else{
      sails.log.debug((role.name + " role has permissions so skipping permission assignment").grey);
    }
  }
}

async function assignPermissionToFirstAdmin(){
  var person = await Person.findOne({"m":"+917007788122"}).populate("permissions");
  if(person){
    const adminRole = await Role.findOne({name: "ADMIN"}).populate("permissions");
    if(person.r==null){
      sails.log.debug('Assigning role to first admin user');
      await Person.update({id:person.id}, {r: adminRole.id});
      sails.log.debug('Role assigned successfully');
    }else{
      sails.log.debug(("Role already assigned").grey);
    }
    if(person.permissions.length==0){
      sails.log.debug('Assigning permission to first admin user');
      await Person.addToCollection(person.id, "permissions").members(getPermissionIds(adminRole.permissions));
      sails.log.debug('Permission assigned successfully to first user');
    }else{
      sails.log.debug(("Permissions already assigned to first user").grey);
    }
  }else{
    sails.log.debug("No user found");
  }
}

function getPermissionIds(permissions) {
  
  var permissionIds = [];
  for (var i = 0; i < permissions.length; i++) {
    permissionIds[i] = permissions[i].id;
  }
  return permissionIds;
}

async function getSearchIndexes(){
  try {
    const db = Person.getDatastore().manager;
    const collection = db.collection("cvector");
    // run the helper method
    const result = await collection.listSearchIndexes().toArray();
    console.log(result);
  } finally {
    // await client.close();
  }
}

async function createIndices(){
  // getSearchIndexes();
  sails.log.debug(("Creating indices").grey);
  db = Person.getDatastore().manager;
  var result = await db.collection(Person.tableName).createIndex( { n: 1, m: 1, e: 1 } );
  db = UserLogin.getDatastore().manager;
  var result = await db.collection(UserLogin.tableName).createIndex( { lt: 1, m: 1, e: 1 } );

  sails.log.debug(("Indices created").grey);
}

module.exports.bootstrap = async function(done) {

  require("dotenv").config();

  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  if (sails.config.seed && hasSeedInfo()) {
    async.series([doSeed], done);
    createFirstUserLogin();
    createIndices();  
    assignPermissionToRoles();
    assignPermissionToFirstAdmin();

  }else{
    return done();
  }

};
