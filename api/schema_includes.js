module.exports = function(app)
{
 require("@models/rolesSchema.js");
 require("@models/accountsSchema.js")
 require("@models/routesSchema.js");
 require("@models/userSchema.js");

require("@models/imagesSchema.js");

require("@ecommerce/ordersSchema.js");

require("@ecommerce/productsSchema.js");

require("@ecommerce/customersSchema.js");

require("../api/models/financials/financialsSchema.js");

require("../api/models/hugo/hugoSchema.js");

require("../api/models/navigation/navigationSchema.js");

require("../api/models/test/testSchema.js");

require("../api/models/email/emailSchema.js");

require("../api/models/newTriggersSchema.js");

require("../api/models/logging/loggingSchema.js");


//require("../api/models/zzendpointzzSchema.js");

}
