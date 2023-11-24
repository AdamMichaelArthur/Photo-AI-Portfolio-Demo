import { Base, ResponseError } from '@base'
import * as util from "util";

export default class Listings extends Base {

	constructor(){
		super();
	}

	async search(StartDate ="", EndDate ="", GPS =[]){
		const hasRequiredParameters = this.requiredParams(["StartDate", "EndDate", "GPS"], ["prevPage", "nextPage", "amenities"]);
		if(!hasRequiredParameters){
					return;
		}

		// Let's do some additional type checking
		if(this.body.GPS.length != 2){
			this.errors.error("GPS", "The GPS should be an array with two float elements");
			return;
		}

		if(!Array.isArray(this.body.GPS)){
			this.errors.error("GPS", "The GPS should be an array with two float elements");
			return;
		}

		if ((typeof this.body.GPS[0] !== 'number')||(typeof this.body.GPS[1] !== 'number')) {
			this.errors.error("GPS", "The GPS array elements must be a number type");
			return;
		}

		let listings = this.database.db.collection('listings');

		const nextPage = this.body.nextPage;

		let matchCondition = {}; // Initialize an empty match condition

		if (nextPage !== false) {
		  matchCondition = {
		    _id: { $gt: nextPage }
		  };
		}

		const prevPage = this.body.prevPage; // Replace with the actual value

		if (prevPage !== false) {
		  matchCondition = {
		    _id: { $lt: prevPage }
		  };
		}

		const amenityArray = this.body.amenities;

		let amenityMatchCondition = { };

		if(Array.isArray(this.body.amenities)){
			if(this.body.amenities.length > 0){
				amenityMatchCondition = {
				  $and: []
				};

				amenityArray.forEach((amenity) => {
				  const condition = {};
				  condition[`Property.PropertyAmenities.${amenity}`] = true;
				  amenityMatchCondition.$and.push(condition);
				});
			}
		}

		let aggregate = [
		  {
		    $geoNear: {
		      near: {
		        type: "Point",
		        coordinates: [41.05314902455228, 29.031734625650678]
		      },
		      distanceField: "distance",
		      maxDistance: 4828, // Approx 3 miles in meters
		      spherical: true
		    }
		  },
		  {
		    $match: {
		      "RoomType.Availability.AvailablePeriods": {
		        $elemMatch: {
		          StartDate: { $gte: "2023-12-01" },
		          EndDate: { $lte: "2023-12-15" }
		        }
		      }
		    }
		  },
		  {
    		$match: amenityMatchCondition // Use the matchCondition to filter results
  		  }, 
		  {
		    $unwind: "$RoomType"
		  },
		  {
		    $match: {
		      "RoomType.Availability.AvailablePeriods": {
		        $elemMatch: {
		          StartDate: { $lte: "2023-12-01" },
		          EndDate: { $gte: "2023-12-15" }
		        }
		      }
		    }
		  },
		  {
		    $group: {
		      _id: "$Property.HotelName",
		      minPrice: { $min: "$RoomType.RoomPrice" },
		      maxPrice: { $max: "$RoomType.RoomPrice" },
		      details: { $first: "$$ROOT" }
		    }
		  },
		  {
		    $match: {
		      minPrice: { $gte: 20 },
		      maxPrice: { $lte: 250 }
		    }
		  },
		  {
		    $limit: 10 // Add a limit of 10 to the result
		  },
		    {
    $match: matchCondition // Use the matchCondition to filter results
  },

  {
    $limit: 10 // Add a limit of 10 to the result
  }
		];


		console.log(135, util.inspect(aggregate, false, null, true /* enable colors */));

		let result = await listings.aggregate(aggregate).toArray();

		this.response.reply( { "listings": result } );
	}

} 