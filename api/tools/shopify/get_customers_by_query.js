const { z } = require("zod");
const { SEARCH_CUSTOMER } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class SearchCustomers extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_customer_orders"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                customer_id: z.number().optional(),
                first_name: z.string().optional(),
                last_name: z.string().optional(),
                email: z.string().optional(),
                phone: z.string().optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SEARCH_CUSTOMER
        });
    }

    extractCustomers(customers){
        var fCustomers = [];
        for(var customer of customers){
            var temp = {};
            temp['customer_id'] = customer['id'];
            temp['email'] = customer['email'];
            temp['created_at'] = customer['created_at'];
            temp['first_name'] = customer['first_name'];
            temp['last_name'] = customer['last_name'];
            temp['state'] = customer['state'];
            temp['currency'] = customer['currency'];
            temp['phone'] = customer['phone'];
            fCustomers.push(temp);
        }
        return fCustomers;
    }

    async _call(arg) {
        var response = await this.shopify.customer.search(arg);
        response = this.extractCustomers(response);
        return JSON.stringify(response);
    }
}
 
module.exports = {SearchCustomers}; 