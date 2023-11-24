import { Base, ResponseError } from '@base'

export default class App extends Base {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

}