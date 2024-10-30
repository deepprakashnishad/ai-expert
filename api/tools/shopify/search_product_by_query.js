const { z } = require("zod");
const { SEARCH_PRODUCT_BY_QUERY } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class SearchProductByQuery extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "search_product_by_query"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                productSearchString: z.string().describe("Product title, name, or description for calling search API."),
                result_count: z.number().default(5),
                // prefix: z.enum(["LAST", "NONE"]).default("LAST"),
                productFilters: z.object({
                    available: z.boolean().default(true),
                    price: z.object({
                        max: z.number().optional(),
                        min: z.number().optional()
                    }).optional(),
                    tag: z.string().optional(),
                    productType: z.string().optional(),
                    variantOption: z.object({
                        name: z.string(),
                        value: z.string()
                    }).optional()
                }).optional(),
                sortKey: z.enum(["PRICE", "RELEVANCE"]).default("RELEVANCE"), 
                types: z.enum(["ARTICLE","PAGE", "PRODUCT"]).default("PRODUCT"),
                unavailableProducts: z.enum(["HIDE", "LAST", "SHOW"]).default("LAST")
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SEARCH_PRODUCT_BY_QUERY
        });
    }

    extractProduct(products){
        var fProducts = [];
        for(var prod of products){
            prod = prod['node'];
            var temp = {};
            temp['product_id'] = prod['id'];
            temp['title'] = prod['title'];
            temp['descriptionHtml'] = prod['descriptionHtml'];
            temp['handle'] = prod['handle'];
            temp['product_url'] = `${this.baseUrl}products/${temp['handle']}`;
            temp['product_type'] = prod['productType'];
            temp['status'] = prod['status'];
            if(prod.variants && prod.variants.edges){
                temp['variants'] = prod.variants.edges.map(ele => {
                    ele = ele.node;
                    return {
                        // availableForSale: ele.availableForSale,
                        price: ele.price,
                        // quantityAvailable: ele.quantityAvailable>0?ele.quantityAvailable:"Out of stock"
                    }
                });    
            }

            if(prod.images && prod.images.edges){
                temp['images'] = prod.images.edges.map(ele=>ele.node);    
            }

            temp['actions'] = [{"name": "add_to_cart", "display_name": "Add to Cart", "data-product-id": prod['id']}, {"name": "like", "display_name": "Like", "data-product-id": prod['id']}];
            temp['template_name'] = "product_template";
            fProducts.push(temp);
        }
        return fProducts;
    }

    async _call(arg) {
        
        if(arg['prefix']===""){
            delete arg['prefix']
        }
        const productQuery = `
        query searchProducts($query: String!, $first: Int) {
            search(query: $query, first: $first, types: PRODUCT) {
              edges {
                node {
                  ... on Product {
                    id
                    title
                    handle
                    descriptionHtml
                    productType
                    images(first: 1) {
                        edges {
                          node {
                            originalSrc
                            altText
                          }
                        }
                    }
                    variants(first: 1) {
                    edges {
                        node {
                            id
                            title
                            price {
                              amount
                              currencyCode
                            }
                            availableForSale
                            quantityAvailable
                          }
                        }
                    }
                  }
                }
              }
            }
        }`;
        const {data, errors, extensions} = await this.storefrontClient.request(productQuery, {
          variables: {
            query: arg['productSearchString'],
            first: arg['result_count'],
          },
        });
        if(!errors){
            const products = this.extractProduct(data['search']['edges']);
            return {"template": "chatbot_product", "products": JSON.stringify(products)};
        }else{
            console.log(errors);
            return "Due to technical issue unable to fetch the results right now. Try again later.";
        }        
    }
}
 
module.exports = {SearchProductByQuery}; 