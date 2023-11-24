import { Base, ResponseError } from '@base'
import AvailablePlans from "@plans/plans.js"
import Voca from "voca";

export default class Plans extends Base {

  constructor(){
    super();
  }

  async getCurrentApplications(){
  	return this.response.reply( { current_plan: this.userAccount.plan } );
  }

}