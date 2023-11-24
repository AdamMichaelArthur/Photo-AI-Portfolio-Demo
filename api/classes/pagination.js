var helpers = require("@classes/helpers.js");
var mongoose = require("mongoose");
var apiVersion = "";
var voca = require("voca");
const util = require('util')



exports.listByPage = async function(
  req,
  res,
  mongooseModel,
  defaultLimit =10,
  searchModifier ={ created_by: null },
  requestedKeys =[],
  searchall =false,
  sort ={ _id: 1 } //, last_id, page, limit, max_records)
) {

  var queryParams = req.originalUrl.lastIndexOf("?");
  if (queryParams != -1) {
    req.originalUrl = req.originalUrl.slice(0, queryParams);
  }
  var userId = res.locals.user._id;

  if (searchall == false){
    searchModifier.created_by = userId;
  }

  if(searchall == true){
    if(Object.keys(searchModifier["created_by"])[0] !== '$ne'){
      delete searchModifier["created_by"];
    }
  }

  console.log(65, searchall, searchModifier)

  // route = helpers.getEndpoint(req);
  var route = req.originalUrl;
  if (req.get("host") != "localhost:3000") {

    //route = process.env.API_VERSION + route
  }

  var endpoint = req.originalUrl.slice(1, req.originalUrl.length);
  var slashIdx = endpoint.lastIndexOf("/page");
  if (slashIdx != -1) {
    route = "/" + endpoint.substr(0, slashIdx);
  } else {
  }

  var owner = res.locals.user.accountId;
  var user_id = res.locals.user._id;
  var Last_id = null;
  var Limit = null;
  var currentPage = 1;

  // Check and see if a page was supplied

  if (req.params["page"] == null) {
    currentPage = 1;
  } else currentPage = req.params["page"];

  var previousPage = currentPage - 1;
  if (previousPage == 0) previousPage = 1;

  if (req.params["id"] == null) {
    Last_id = await mongooseModel
      .findOne(searchModifier)
      .sort(sort)
      .select("_id");
    if (Last_id == null) {

      return exports.listPaginatedResponse(
        owner,
        mongooseModel,
        [],
        helpers.getParameter(route, "datasource"),
        count,
        req,
        res,
        defaultLimit,
        requestedKeys,
        searchModifier
      );
    }

    Last_id = Last_id._id;
  } else Last_id = req.params["id"];

  var max_records = defaultLimit * 10;
  if (req.params["max_records"] != null)
    max_records = req.params["max_records"];

  if (Limit === undefined || Limit == null) {
    Limit = defaultLimit * 10;
  }

  var count = await mongooseModel.count(searchModifier);
  try {
    var searchObj = {
      ...{
        _id: { $gte: Last_id }
      },
      ...searchModifier
    };

    var results = await mongooseModel
      .find(searchObj, { _id: 1 })
      .select("_id")
      //.where({owner:owner})
      .sort(sort)
      .limit(Limit);
  } catch (err) {}

        //console.log(111, results);
        
  if (results.length == 0) {
    var result = {
      number_of_pages: 0,
      current_page: 0,
      previous_page: 0,
      next_page: 0,
      total_records: 0,
      prev_page_endpoint: "",
      next_page_endpoint: ""
    };
    //route = route.slice(0, -1);
    var responseObject = helpers.defaultResponseObject(helpers.getRoute(req));
    // var numItems = 0;
    // numPages = 0;
    // var currentPage = parseInt(req.params["page"]);
    // if(req.params["page"] == null)
    //   currentPage = 1;



    var slashIdx = route.lastIndexOf("/");
    route = route.substr(slashIdx + 1, route.length - 1);
    responseObject[route] = [];
    responseObject["pagination"] = result;
    responseObject["datasource"] = helpers.getParameter(route, "datasource")
    res.status(200);

    res.json(responseObject);
    return;

    return result;
  }

  var lastItemId = results[results.length - 1]._id;
  var firstItemId = results[0]._id;

  var fullUrl =
    req.protocol +
    "://" +
    req.get("host") +
    process.env.API_VERSION +
    req.originalUrl;


  var result = {
    number_of_pages: Math.ceil(count / Limit),
    current_page: currentPage,
    previous_page: previousPage,
    next_page: currentPage + 1,
    total_records: count,
    prev_page_endpoint:
      `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION +
      route +
      "/page/" +
      (currentPage + 1) +
      "/id/" +
      firstItemId,
    next_page_endpoint:
      `${req.protocol}://${req.get("host")}` +
      process.env.API_VERSION +
      route +
      "/page/" +
      (currentPage + 1) +
      "/id/" +
      lastItemId
  };

  var nextIDRecordCount = defaultLimit / 2;

  var requestedPage = currentPage;
  if (currentPage < 6) {
    var additionalNextRecordIDs = 0;
    var bet = requestedPage * defaultLimit; // 20
    var loss = bet - defaultLimit * 5 * -1; // 20 - 50 * -1 = 30
    nextIDRecordCount =
      nextIDRecordCount + loss - bet - (requestedPage - 1) * defaultLimit;
  }

  var searchObj = {
    ...{
      _id: { $gt: lastItemId }
    },
    ...searchModifier
  };

  //console.log(193, searchObj)
  var nextIds = await mongooseModel
    .find(searchObj, { _id: 1 })
    .sort({ _id: 1 })
    .select("_id")
    //.where({ owner : owner})
    .limit(nextIDRecordCount);

    //console.log(198, searchObj, nextIDRecordCount);

  searchObj = {
    ...{
      _id: { $lt: lastItemId }
    },
    ...searchModifier
  };

  //console.log(210, searchObj)
  var prevIds = await mongooseModel
    .find(searchObj, { _id: 1 })
    .select("_id")
    .sort(sort)
    //.where({ owner : owner})
    .limit((max_records * defaultLimit) / 2);

  searchObj = {
    ...{
      _id: { $gte: firstItemId }
    },
    ...searchModifier
  };

  //console.log(225, searchObj)
  var resultSetQuery = await mongooseModel
    .find(searchObj)
    //.select("_id")
    .sort(sort)
    //.where({ owner : owner})
    .limit(defaultLimit + 1);

    //console.log(235, "Calling exports.listPaginatedResponse");
  exports.listPaginatedResponse(
    owner,
    mongooseModel,
    resultSetQuery,
    route,
    count,
    req,
    res,
    defaultLimit,
    requestedKeys,
    searchModifier
  );
  return result;
};


exports.listByPageFind = function(
  customer_id,
  mongooseModel,
  last_id,
  requestedPage,
  max_records,
  callback,
  defaultLimit = 10,
  sort ={_id:1}
) {
  var nextIDRecordCount = (max_records * defaultLimit) / 2;
  if (requestedPage == null) requestedPage = 0;

  if (requestedPage < 6) {
    var additionalNextRecordIDs = 0;
    var bet = requestedPage * defaultLimit; // 20
    var loss = bet - ((defaultLimit * 5) / 2) * -1; // 20 - 50 * -1 = 30
    nextIDRecordCount =
      nextIDRecordCount + loss - bet - (requestedPage - 1) * defaultLimit;
  }

  //console.log(268, "Not Using searchObj")
  mongooseModel
    .count({}, function(err, count) {
      var mongooseQuery = mongooseModel
        .find({ _id: { $gte: last_id } }, { _id: 1 })
        .sort(sort)
        .limit(nextIDRecordCount);
      mongooseQuery.exec(function(err, nextIDs) {
        var mongooseQuery = mongooseModel
          .find({ _id: { $lt: last_id } }, { _id: 1 })
          .sort(sort)
          .where({ customer_id: customer_id })
          .limit((max_records * defaultLimit) / 2);
        mongooseQuery.exec(function(err, prevIDs) {
          var resultSetQuery = mongooseModel
            .find({ _id: { $gt: last_id } })
            .sort(sort)
            .limit(defaultLimit);
          resultSetQuery.exec(function(err, resultSet) {
            callback(prevIDs, nextIDs, resultSet, count);
          });
        });
      });
    })
    .where({ owner: customer_id });
};

async function getPaginatedIDs(
  owner,
  mongooseModel,
  _id,
  max_records,
  callback,
  searchModifier = { owner: owner },
  defaultLimit = 10,
  sort ={_id:1}
) {
  // To correctly paginate, we need the _id's of the
  // 100 (of less) or the records that come before
  // and 100 (or less) of the records that come after

  // The way I'm using mongo db right now has got to
  // very ineffecient.  Not experienced enough in it
  // yet to create advanced queries.  I would imagine
  // that I can create one big query to do all of this,
  // instead of chaining them like I'm doing now.
  // I'll worry about that when it gets to optimizing.
  // For now, this is far more effecient than using skip()

  // First, we need to get the id of the first item of the last page

  var myQuery = { _id: { $lte: _id } };

      var searchObj = 
      {
        ...
            { _id: { $lte: _id } },
        ...searchModifier
      };

  var prevPageQuery = mongooseModel
    .find(searchObj, { _id: 1 })
    .sort({_id: -1 })
    //.where({owner:owner})
    .limit(max_records * defaultLimit + 1);

  prevPageQuery.exec(function(err, prevIDs) {

    var searchObj = 
      {
        ...
            { _id: { $gte: _id } },
        ...searchModifier
      };

    //console.log(339, searchObj);
    var mongooseQuery = mongooseModel
      .find(searchObj, { _id: 1 })
      .sort(sort)
      //.where({owner:owner})
      .limit(max_records * defaultLimit);

    mongooseQuery.exec(function(err, nextIDs) {
      callback(err, prevIDs, nextIDs);
    });
  });
}

exports.listPaginatedResponse = function(
  customer_id,
  model,
  items,
  desc,
  count,
  req,
  res,
  maxrecords =10,
  requestedKeys,
  searchObj
) {
  //console.log(370, requestedKeys, searchObj);
  var queryParams = req.originalUrl.lastIndexOf("?");
  if (queryParams != -1) {
    req.originalUrl = req.originalUrl.slice(0, queryParams);
  }

  var endpoint = helpers.getRoute(req); // helpers.getParameter(req.params[0], "datasource"); //req.originalUrl.slice(1, req.originalUrl.length);
  var slashIdx = endpoint.lastIndexOf("/page");
  if (slashIdx != -1) {
    endpoint = "/" + endpoint.substr(0, slashIdx);
    slashIdx = endpoint.lastIndexOf("/");
    endpoint = endpoint.substr(slashIdx + 1, endpoint.length - 1);
  } else {
    //endpoint = endpoint.slice(0, -1);
    slashIdx = endpoint.lastIndexOf("/");
    //endpoint = endpoint.substr(slashIdx+1, endpoint.length-1)
  }

  var responseObject = helpers.defaultResponseObject(helpers.getRoute(req));
  var numItems = count;
  numPages = Math.ceil(numItems / maxrecords);
  var currentPage = parseInt(req.params["page"]);
  if (req.params["page"] == null) currentPage = 1;

  if (items.length == 0) {
    // responseObject[desc] = [];
    // res.status(200);

    // res.json({ responseObject });

    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    defaultErrorResponse["Error"] = 41231;
      defaultErrorResponse.error = 41231;
      defaultErrorResponse.ErrorDetails.Error = 41231;
      defaultErrorResponse.ErrorDetails.Description = "Nothing to see here";

    res.status(201);

    res.json(defaultErrorResponse);

    return;
  }

  //items = items.slice( 0, 10);

  var firstItemId = items[0]["_id"];
  var itemLength = items.length;
  //if(items.length < itemLength)
  //  itemLength = items.length
  var lastItemId = items[itemLength - 1]["_id"];

  //if(items.length>1)
  //  items.pop();

  getPaginatedIDs(customer_id, model, firstItemId, maxrecords, function(
    err,
    prevIDs,
    nextIDs
  ) {
    var nextPage = currentPage + 1;
    if (currentPage == numPages) {
      lastItemId = req.params["id"];
      nextPage = currentPage;
    }
    var prevPage = currentPage - 1;
    if (prevPage == 0) prevPage = 1;

    try {
    } catch (err) {}

    if (prevIDs.length < 20) {
      firstItemId = prevIDs[prevIDs.length - 1]._id;
    } else firstItemId = prevIDs[maxrecords]._id;

    var pageAr = buildPageArray(
      prevIDs,
      nextIDs,
      currentPage,
      desc,
      numPages,
      req,
      maxrecords
    );

    var paginatedResponse = {
      number_of_pages: numPages,
      current_page: currentPage,
      previous_page: prevPage,
      next_page: nextPage,
      total_records: numItems,
      next_page_endpoint:
        `${req.protocol}://${req.get("host")}` +
        process.env.API_VERSION +
        desc +
        "/page/" +
        nextPage +
        "/id/" +
        lastItemId,
      prev_page_endpoint:
        `${req.protocol}://${req.get("host")}` +
        process.env.API_VERSION +
        desc +
        "/page/" +
        prevPage +
        "/id/" +
        firstItemId,
      first_page_endpoint:
        `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + desc,
      last_page_endpoint:
        `${req.protocol}://${req.get("host")}` + process.env.API_VERSION + desc,
      pages: pageAr
    };

    responseObject["pagination"] = paginatedResponse;

    if (items.length > maxrecords) items.pop();

    for (var i = 0; i < items.length; i++) {
      var obj = items[i].toObject();


      var values = Object.values(obj);
      var keys = Object.keys(obj);

      for (var y = 0; y < values.length; y++) {
        var value = values[y];
        var key = keys[y];
        var type = voca.capitalize(typeof value);
        if (type == "object") {
          // Iterate through the object looking for a 'label' key

        }
        if (Array.isArray(value)) {
          var replacementAr = [];
          for (var t = 0; t < value.length; t++) {
            var arr = value[t];
            if (typeof value[t] == "object") {
              // See if there is a 'label' key
              if(value[t] != null){
              if (typeof value[t]["label"] != "undefined") {
                var label = value[t]["label"];
                replacementAr.push(label);
              } else {
                replacementAr.push(value[t]);
              }}
            } else {
              replacementAr.push(arr);
            }
          }

          value = replacementAr;
          obj[key] = replacementAr;
          items[i] = obj;
        }
      }
    }

    responseObject[endpoint] = items;

    res.status(200);

    if (responseObject[endpoint].length == 11) responseObject[endpoint].pop();
    var headers = [];

    for(var t = 0; t < items.length; t++){
            try {
              var item = items[t].toObject()
              headers = headers.concat(Object.keys(item))
            } catch (err) {
              headers = headers.concat(Object.keys(items[t]))
            }
    }
          headers = [...new Set(headers)]
          requestedKeys = [...new Set(requestedKeys)];

          var standardKeys = ["created_by",
                "modified_by",
                "_id",
                "owner",
                "created",
                "modified",
                "__v"];

            for(var y = 0; y < items.length; y++){
              try {
                items[y] = items[y].toObject()
              } catch (err){
                // Is already an object
              }

              var keys = Object.keys(items[y]);
              var sendObj = {}
              if(requestedKeys.length > 0){
                sendObj["_id"] = items[y]["_id"];
                for(var i = 0; i < requestedKeys.length; i++){
                  var requestedKey = requestedKeys[i];
                  if(keys.includes(requestedKey)){
                    sendObj[requestedKey] = items[y][requestedKey]
                  }
                }
                items[y] = sendObj;
              }
            }
    
    var parsedHeaders = [];
    var displayHeaders = [];
    var addDataForm = [];
    var keysToSend = [];
    if (items.length > 0) {
      try {
        items[0] = items[0].toObject();
      } catch (err) {
        // error
      }

      var headersTmp = [];
      for(var x = 0; x < requestedKeys.length; x++){
        for(var r = 0; r < headers.length; r++){
          if(requestedKeys[x] == headers[r]){
            headersTmp.push(headers[r]);
          }
        }
      }
      headers = headersTmp;

      //Object.keys(items[0]);
      var standardKeys = [
        "created_by",
        "modified_by",
        "_id",
        "owner",
        "created",
        "modified",
        "__v"
      ];

      for (var y = 0; y < items.length; y++) {
        var keys = Object.keys(items[y]);
        var sendObj = {};
        if (requestedKeys.length > 0) {
          sendObj["_id"] = items[y]["_id"];
          for (var i = 0; i < requestedKeys.length; i++) {
            var requestedKey = requestedKeys[i];
            if (keys.includes(requestedKey)) {
              sendObj[requestedKey] = items[y][requestedKey];
            }
          }
          items[y] = sendObj;
        }
      }

      for (var i = 0; i < headers.length; i++) {
        var typeKey = [headers[i]][0];
        var obj = items[0];
        var type = voca.capitalize(typeof obj[typeKey]);
        if (Array.isArray(obj[typeKey])) type = "Array";

        var header = {
          field_label: voca.titleCase(voca.replaceAll(headers[i], "_", " ")),
          field_name: voca.lowerCase(voca.snakeCase(headers[i])),
          type: type
        };

        if (type == "String") {
          // Check and see if this is a datetime

          var isDate = Date.parse(obj[typeKey]);
          var noSpaces = obj[typeKey].indexOf(" ");
          if (!isNaN(isDate)&&(noSpaces == -1)) {                     //1607040720000 
            //console.log(624, isDate, obj[typeKey]); //978303600000
            // We've got a valid date
            header.type = "Date";
            header.formType = {
              controlType: "date"
            };
          } else {
            header.type = "String";
            header.formType = {
              controlType: "text"
            };
          }
        }

        if (header.type == "Number") {
          header.formType = {
            controlType: "number"
          };
        }

        if (header.type == "Array") {
          header.formType = {
            controlType: "select",
            options: obj[typeKey]
          };
        }

        if (header.type == "Boolean") {
          header.formType = {
            controlType: "checkbox",
            options: ["True", "False"]
          };
        }


        if(header.type == "Object"){
          header.type = "String";
          header.formType = {
            controlType: "text"
          };
        }

        if(header.type == "Undefined"){
          header.type = "String";
          header.formType = {
            controlType: "text"
          };
        }

        if (!standardKeys.includes(headers[i])) {
          parsedHeaders.push(headers[i]);
          addDataForm.push(header);
          displayHeaders.push(header.field_label);
        }
      }
    }

        responseObject["headers"] = parsedHeaders;
        responseObject["displayHeaders"] = displayHeaders;
        responseObject["addDataForm"] = addDataForm;

        // Array.prototype.swap = function (x,y) {
        //   var b = this[x];
        //   this[x] = this[y];
        //   this[y] = b;
        //   return this;
        // }

        // asc || desc
        var changeToArray = voca.search(req.originalUrl, "asc", 0);
        if(changeToArray != -1){

          var sortBy = helpers.getParameter(req.originalUrl, "asc");

          // Order responseObj[endpoint] by the value of the sortBy key
          var arrayOfObjects = responseObject[endpoint]
          var bSwap = false;

          var tmpLen = arrayOfObjects.length;
          for(var a = 0; a < tmpLen; a++){
            var object = arrayOfObjects[a];
            var sortValue = object[sortBy]; 
            if(typeof sortValue != 'undefined'){  // Just in case it doesn't work
              if(a < arrayOfObjects.length-1){
                var x = a+1;
                var cmp1 = arrayOfObjects[a][sortBy], cmp2 = arrayOfObjects[a+1][sortBy];
                 if(cmp2 < cmp1)
                 {
                   var tmp = arrayOfObjects[a]
                   arrayOfObjects[a] = arrayOfObjects[a+1]
                   arrayOfObjects[a+1] = tmp;
                   bSwap = true;
                 }
              } else {
                // This is the last element in the array.
                var cmp1 = arrayOfObjects[a], cmp2 = arrayOfObjects[a-1][sortBy];
                // We want to make sure that cmp1 > cmp2
                if(cmp1 < cmp2){
                } else {
                }
                if(bSwap == true){
                  a = -1;
                  bSwap = false;
                }
              }
            } else {
            }
          }
        }

        // Modifiers
        changeToArray = voca.search(req.originalUrl, "toarray", 0);
        if(changeToArray != -1){
          var responseAr = [];

          for(var i = 0; i < responseObject[endpoint].length; i++){
            var responseObjKeys = Object.keys(responseObject[endpoint][i])
            
            for(var y = 0; y < responseObjKeys.length; y++){

               if(responseObjKeys[y] != "_id"){
                 responseAr.push(responseObject[endpoint][i][responseObjKeys[y]])
              }
            }
            //if(responseObject.endpoint[i])
          }
          responseObject = responseAr
        }

        var changeToArray = voca.search(req.originalUrl, "simple", 0);
        if(changeToArray != -1){
          var responseAr = [];

          for(var i = 0; i < responseObject[endpoint].length; i++){
            var responseObjKeys = Object.keys(responseObject[endpoint][i])
            var respObj = {}
            for(var y = 0; y < responseObjKeys.length; y++){

               if(responseObjKeys[y] != "_id"){
                 //responseAr.push(responseObject[endpoint][i])
                 respObj[responseObjKeys[y]] = responseObject[endpoint][i][responseObjKeys[y]]
                 
              }
            }
            responseAr.push(respObj)
            //if(responseObject.endpoint[i])
          }
          responseObject = responseAr
          
        }

        // Sizing?
        /*
          1-3 characters = 25px;
        */

        responseObject["datasource"] = helpers.getParameter(desc, "datasource");

        // Ensure the main data object has key/value pairs for all requested fields -- even if the database returned empty
        for(var i = 0; i < items.length; i++){
          var item = items[i]
          for(var y = 0; y < responseObject["headers"].length; y++){
            var header = responseObject["headers"][y];
            var bHeaderPresent = false;
            for (const [key, value] of Object.entries(item)) {
              if(header == key){
                bHeaderPresent = true;
              }
            }
            if(bHeaderPresent == false){
              item[header] = "";
            }
          }
        }

        ensuredKeys = ensureRequestedKeys(responseObject[responseObject["datasource"]], requestedKeys)

        //console.log(856, responseObject)

        res.json(responseObject)
  }, searchObj);
};

  /* The order of the objects is important for the flextable to correctly display the data.  Here are are
      ensuring that the requestedKeys and the result object have a consistent order to them
  */

  function ensureRequestedKeys(resultSetQuery, requestedKeys){

    for(var i = 0; i < resultSetQuery.length; i++){
      var result = resultSetQuery[i]

      var keys = Object.keys(result);
      var haromizedResultSet = {}

      for(var x = 0; x < requestedKeys.length; x++){

        haromizedResultSet[requestedKeys[x]] = result[requestedKeys[x]]
        delete result[requestedKeys[x]]
      }

      result = { ... result, ... haromizedResultSet }
      resultSetQuery[i] = result;
    }

    

    return resultSetQuery
  }


function buildPageArray(
  prevIDs,
  nextIDs,
  requestedPage,
  desc,
  lastPage,
  req,
  max_records = 10
) {

  if(lastPage == 1){
    return [];
  }
  var currentPage = requestedPage;
  var nextPages = [];
  var numberOfPages = lastPage;
  var pageCounter = 0;

  prevIDs.reverse();

  if(prevIDs.length == 1){
     ;//addToPage(req, desc, 1, prevIDs[0], nextPages)
  } else {
    for (var i = (prevIDs.length-1); i >= 0; i = i - (max_records)) {
      pageCounter++;
      if(i >= max_records)
        addToPage(req, desc, currentPage - pageCounter, prevIDs[i-max_records], nextPages)
      else {
      }
    }
  }

  nextPages.reverse();

  // This section handles creating the array for the NEXT pages
  pageCounter = 0;

  for (var i = 0; i < nextIDs.length; i = i + (max_records)) {
    addToPage(req, desc, currentPage + pageCounter, nextIDs[i], nextPages)
    pageCounter++;
  }

  if(currentPage < 5){
    if(nextPages.length > 10){
      nextPages.splice(10, nextPages.length - 10);
    }
  }

  if((currentPage >= 5)){
    if(nextPages.length > 10){
      var firstSlice = (nextPages.length+1) - currentPage;

      var firstPage = currentPage - 4;
      if(firstPage < 1)
        firstPage = 1;
      var lastPage = currentPage + 5;
      if(lastPage > firstPage + 10)
        lastPage = firstPage + 10;

      var firstIdx = 0;
      var lastIdx = 0;
      for(var u = 0; u < nextPages.length; u++){
          if(nextPages[u].page_number == firstPage)
            firstIdx = u;
          if(nextPages[u].page_number == lastPage)
            lastIdx = u;
      }
      if(currentPage < (numberOfPages-5)){
        //console.log(845, "splicing")
        nextPages.splice(0, firstIdx)
      }

        for(var u = 0; u < nextPages.length; u++){
          if(nextPages[u].page_number == lastPage)
            lastIdx = u;
        }

        var nextLen = nextPages.length
        if(nextLen > 10)
          nextLen = 10;

        if(currentPage < (numberOfPages-5)){
        for(var u = 0; u < nextLen; u++){
          if(nextPages[u].page_number == lastPage){
            var spliceAmt = nextPages.length - u;
            //console.log(845, "splicing")
            nextPages.splice(u+1, spliceAmt-1);
            break;
            }
          }
        } else {
          //console.log("Do something else");
          nextPages.splice(0, nextPages.length-10);
          // Do something else here
        }

    }
  }

  var bEven = true;
  // while(nextPages.length > 10){
  //   if(bEven){
  //     //nextPages.splice(0, 1)
  //   } else {
  //     //nextPages.splice(nextPages.length-1, 1);
  //   }

  //   bEven = !bEven;
  // }
  return nextPages;
}

function addToPage(req, desc, currentPage, nextID, nextPages){
  var pageObj = {};

  if(typeof nextID === 'undefined'){
    return;
  }
  
  pageObj["_id"] = nextID._id;
  pageObj["page_number"] = currentPage;

  if(currentPage < 1)
    return;

  pageObj["page_endpoint"] =
            `${req.protocol}://${req.get("host")}` +
            process.env.API_VERSION +
            desc +
            "/page/" +
            String(currentPage) +
            "/id/" +
            nextID["_id"];
  nextPages.push(pageObj);
}

exports.searchByPattern = async function(req, res, model, key, searchTerm, all =false, aggregate =false) {
  var searchObject = {
    created_by: mongoose.Types.ObjectId(res.locals.user._id)
  };

  if(all == "all"){
    searchObject = {}
  }

  if(all == "account"){
    searchObject = {
        "owner": res.locals.user.accountId
    }
  }

  if (isNaN(searchTerm)) {
    // searchTerm is not a number
    searchObject[key] = new RegExp(searchTerm, "i");
  } else {
    searchObject[key] = parseInt(searchTerm);
  }
  
  if(aggregate == false){
    var searchResults = await model.find(searchObject).limit(50);
    return searchResults;
  } else {
    var searchResults = await model.aggregate(aggregate).limit(50);
    console.log(1018, searchResults.length)
    return searchResults;
  }
};
