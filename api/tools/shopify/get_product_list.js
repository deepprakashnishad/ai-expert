const { z } = require("zod");
const { GET_SOPIFY_PRODUCT_LIST_DESCRIPTION } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetProducts extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "retrieve_shopify_products"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_SOPIFY_PRODUCT_LIST_DESCRIPTION
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(10),
                product_type: z.string().optional(),
                status: z.enum(["active", "archived", "draft"]).default("active"),
                published_status: z.enum(["published", "unpublished", "any"]).default("published"),
                title: z.string().optional(),
                vendor: z.string().optional(),
                ids: z.string().array().optional(),
            })
        });
    }

    extractProduct(products){
        var fProducts = [];
        for(var prod of products){
            var temp = {};
            temp['id'] = prod['id'];
            temp['title'] = prod['title'];
            temp['body_html'] = prod['body_html'];
            temp['vendor'] = prod['vendor'];
            temp['handle'] = prod['handle'];
            temp['product_url'] = `${this.baseUrl}products/${temp['handle']}`;
            temp['product_type'] = prod['product_type'];
            temp['status'] = prod['status'];
            temp['variants'] = prod['variants'];
            temp['options'] = prod['options'];
            temp['currency'] = prod['currency'] || "INR";
            temp['image'] = prod['image'] && prod['image']['src']? prod['image']['src']:undefined;

            fProducts.push(temp);
        }

        return fProducts;
    }

    async _call(arg) {
        try{
            const response = await this.shopify.product.list(arg);
            var products = this.extractProduct(response);
            return JSON.stringify({"template_name": "product_list_template", result: products});    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetProducts}; 