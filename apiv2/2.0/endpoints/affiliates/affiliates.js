import { Base, ResponseError } from '@base'
import { MongoClient, ObjectId } from 'mongodb';

/* This ensures a unique index on the affiliateClaimedDomains collection */

// The really only needs to run once.  We wait 15 seconds to allow for everything to initialize, connect, etc.
// Create a unique index on the "domain" field
setTimeout( () => {
	const collection = global.db.collection('affiliateClaimedDomains');
	collection.createIndex({ domain: 1 }, { unique: true })

  //const gmailCollection = global.db.collection('integrations-gmail');
  //gmailCollection.createIndex({ email: 1 }, { unique: true });

  //db.collection.createIndex({ email: 1 }, { unique: true })

	  .then(() => {
	    console.log("Unique index created successfully on 'domain' field");
	})
	  .catch((error) => {
	    console.error("Error creating unique index:", error);
	});
}, 15000);

export default class Affiliates extends Base {

  constructor(){
    super();
  }

  async addDomain(domain =''){

  	this.database.mongo.collection = "affiliateClaimedDomains";

  	// This shouldn't be necessary.  Indicates there's work to do on the framework 
  	Object.assign(this.database.mongo, this);

	var insertResult = await this.database.mongo.insertOne({ domain: domain });

  	if(insertResult == false){
  		this.errors.error("generic", "This domain is already claimed.  If you think someone has claimed your domain inappropriately, please contact us.")
  		return false;
  	}

  	this.response.reply({ "domain": domain, "status":"claimed" })

    return true;
  }

  async removeDomain(domainId =''){
    let collection = this.database.db.collection("affiliateClaimedDomains");
    // This shouldn't be necessary.  Indicates there's work to do on the framework 
    console.log(54, this.user.accountId);
    try {
      var deleteResult = await collection.deleteOne( { _id: new ObjectId(domainId) })
    } catch(err){
      console.log(58, err);
    }

    this.response.reply(deleteResult);
    return true;
  }

  async getClaimedDomains(){

    let collection = this.database.db.collection("affiliateClaimedDomains");

    // This shouldn't be necessary.  Indicates there's work to do on the framework 
    console.log(54, this.user.accountId);
    try {
      var claimedDomains = await collection.find( { owner: this.user.accountId }, { domain: 1 } ).toArray()
    } catch(err){
      console.log(58, err);
    }

    this.response.reply(claimedDomains);
    return true;
  }

  async getReferredAccounts(){
    let affiliateClaimedDomains = this.database.db.collection("affiliateClaimedDomains");

    let result = await affiliateClaimedDomains.aggregate([
          {
            $match: {
              owner: this.userAccount._id
            }
          },
          {
            $lookup: {
              from: "accounts",
              localField: "domain",
              foreignField: "affiliate-referral",
              as: "accounts"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "accounts._id",
              foreignField: "accountId",
              as: "users"
            }
          },
          {
            $match: {
              accounts: { $ne: [] }
            }
          },
          {
            $unwind: "$accounts"
          },
          {
            $unwind: "$users"
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  "$accounts",
                  "$users"
                ]
              }
            }
          },
          {
            $project: {
              _id: 0,
              "affiliate-referral": 1,
              email: 1,
              first_name: 1,
              last_name: 1
            }
          }
        ]).toArray();

        const docs = result.reduce((acc, doc) => {
          const existingDoc = acc.find((d) => d.email === doc.email);
          if (!existingDoc) {
            acc.push(doc);
          }
          return acc;
        }, []);

      this.response.reply(docs);

  }

  async getStripeLogin(){

      const stripe = this.integrations.stripe.stripe;

      const loginLink = await stripe.accounts.createLoginLink(
        this.userAccount.stripeConnectedAccount.id
      );

      this.response.reply( { "stripe_login_link": loginLink } );
  }


}