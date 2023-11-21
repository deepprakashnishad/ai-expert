module.exports = {
    seed: true,
    Permission: [{
        permission: 'CREATE_ROLE'
    }, {
        permission: 'UPDATE_ROLE'
    }, {
        permission: 'DELETE_ROLE'
    }, {
        permission: 'GET_ROLE'
    }, {
        permission: 'ASSIGN_ROLE_TO_USER'
    }, {
        permission: 'REMOVE_PERMISSION_FROM_USER'
    }, {
        permission: 'ASSIGN_PERMISSION_TO_USER'
    }, {
        permission: 'CREATE_PERMISSION'
    }, {
        permission: 'UPDATE_PERMISSION'
    }, {
        permission: 'DELETE_PERMISSION'
    }, {
        permission: 'GET_PERMISSION'
    }, {
        permission: 'GET_PERSON'
    },{
        permission: 'DELETE_PERSON'
    },{
        permission: 'CREATE_PERSON'
    },{
        permission: 'UPDATE_PERSON'
    }],
    Role: [{
        name: 'ADMIN'
    }, {
        name: 'AGENT'
    }, {
        name: 'GUEST'
    }],

    Person:[{
        name: 'Administrator',
        email: 'admin@ournetwork.com',
        mobile:'+917007788122'
    }],
};