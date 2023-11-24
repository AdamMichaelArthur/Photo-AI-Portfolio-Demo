/*
 *	I have a tool that converts a spreadsheet to JSON
 *	This makes it easy to use
*/

  module.exports = async function spreadsheetToJson(excelFilePath){

    const excelFileBuff = fs.readFileSync(excelFilePath);

    const form = new FormData();
    form.append('spreadsheet', excelFileBuff, 'excelFile.xlsx');

    var baseUrl = 'https://app.contentbounty.com/v1.0/api/'

    if(process.env.LOCAL == "true"){
      var baseUrl = 'http://localhost:3000/api/'
    }

    console.log(258, baseUrl)

    //send form data with axios.  Is this top40 specific?  Probably...
    var response;
    try {
      response = await axios.post(baseUrl + 'exceltojson/upload',
        form, {
        headers: {
          ...form.getHeaders()
        }
      });
    } catch(err){
      return err
    }

    return response.data
  }