const convert = require('xml-js');
const fs = require('fs');

const FAILURE_TO_WRITE = {
    "_attributes": {
      "name": "Angular Test Coverage",
      "time": "0",
      "classname": "Coverage failure"
    },
    "failure": {
      "_attributes": {
        "type": ""
      },
      "_text": "Missing Test Coverage "
    }
  }

 const SUCCESS_TO_WRITE = {
    "_attributes": {
      "name"  :"Angular Test Coverage",
      "time":"0",
      "classname": "Coverage success"
    }
 }

 const FAILURE_ESLINT_TO_WRITE = {
    "_attributes": {
      "name"  :"Angular Eslint errors",
      "time":"0",
      "classname": "Eslint error"
    },
    "failure": {
      "_attributes": {
        "type": ""
      },
      "_text": "Eslint error"
    }
 }

 const SUCCESS_ESLINT_TO_WRITE = {
    "_attributes": {
      "name" :"Angular Lint Coverage",
      "time":"0",
      "classname": "Eslint success"
    } 
 }

let readUnitXML = readXML('./test-results.xml');
let readCloverXML = readXML('./coverage/clover.xml');
let readlintXML = readXML('./lint.xml');

Promise.all([readUnitXML , readCloverXML , readlintXML]).then(data => {
    let unitJSON = convertXML2JS(data[0]);
    let cloverJSON = convertXML2JS(data[1]);
    let lintJSON = convertXML2JS(data[2]);

   
    let cloverResults = getCloverCount(cloverJSON);
    let lintResults = getlintCount(lintJSON);
    let unitResults = getUnitCount(unitJSON , cloverResults , lintResults);
    
    
    let unitResultXML = converJS2XML(unitResults);

    fs.writeFile('./unit.xml',unitResultXML , function(err){
        if(err) throw err;
    });

    
}).catch(err => {
    console.log(err);
})

function converJS2XML(json){
    let options = {ignoreComment:true , spaces:4 , compact:true};
    return convert.js2xml(json, options);
}

function convertXML2JS(xml){
    return convert.xml2js(xml , {compact:true , spaces: 4});
}

function readXML(path){
    return new Promise(function(resolve , reject){
        fs.readFile(path , 'utf-8' , (err , data) =>{
            if(err) return reject(err);
            else return resolve(data);           
        })
    });
}

function getCloverCount(cloverJson){
    // console.log(JSON.stringify(cloverJson));
    const metrics = cloverJson.coverage.project.metrics;
    const unconveredStatements = parseInt(metrics._attributes.statements) - parseInt(metrics._attributes.coveredstatements);

    return {
        totalStatements:parseInt(metrics._attributes.statements),
        coveredStatements:parseInt(metrics._attributes.coveredstatements),
        unconveredStatements
    }
}

function getlintCount(lintJson){
    let err_count = 0;
    let lint_err_count = 0;
    let lint_success_marigin = 5;
    let lint_success_count = 0;
    if(lintJson.testsuites.testsuite){
        const testsuite_count = lintJson.testsuites.testsuite;

        let testsuiteArray = Array.isArray(testsuite_count);

        if(testsuiteArray){
            console.log("ifff");
            for(let i = 0; i < testsuite_count.length; i++) {
              if(Array.isArray(testsuite_count[i].testcase)){
                console.log("ifff is array");             
                err_count  = err_count + parseInt(testsuite_count[i].testcase.length);
              }
              else{
                console.log("ifff is object");                        
                err_count  = err_count + 1;          
              }
            }
        }
          else{
            console.log("else");
            err_count  = err_count + 1; 
          }

          if(err_count > 0){
            if(err_count <= 20) { lint_err_count = 1; }
            if(err_count >= 20 && err_count <= 400){ lint_err_count = 2;}
            if(err_count > 400){ lint_err_count = 3;}
          }
          lint_success_count = lint_success_marigin - lint_err_count;
          console.log("lint_success_count", lint_success_count) ;
          console.log("err_count", err_count);
    }
    return {
            lint_err_count:lint_err_count,
            lint_success_count:lint_success_count
          }    
}

function getUnitCount(unitJson , cloverResults , lintResults){

  console.log(lintResults);
    let total = parseInt(unitJson.testsuite._attributes.tests);
    let failures = parseInt(unitJson.testsuite._attributes.failures);
    let failurelintCount = lintResults.lint_err_count;
    let successlintcount = lintResults.lint_success_count;    

    let totalUnitClover = total +  cloverResults.totalStatements + failurelintCount + successlintcount;
    let totalfailure = failures + cloverResults.unconveredStatements + failurelintCount;
    let successUnitClover = cloverResults.coveredStatements;
    let failureUnitClover = cloverResults.unconveredStatements;


    const unitJsonResult = JSON.parse(JSON.stringify(unitJson)); //for deep copy as Object.assign doesn't support deep copy..

    console.log("unitJsonResult", unitJsonResult);

    if(unitJsonResult.testsuite.testcase){
        if(unitJsonResult.testsuite.testcase !== Array){
          console.log('Not Array');
          const ExistingUnitTest = unitJsonResult.testsuite.testcase
          unitJsonResult.testsuite.testcase = [];
          unitJsonResult.testsuite.testcase.push(ExistingUnitTest);
        }
    }
    else{
      unitJsonResult.testsuite.testcase = [];
    }

    unitJsonResult.testsuite._attributes.tests = totalUnitClover;
    
    unitJsonResult.testsuite._attributes.failures = totalfailure;

    
    if(failureUnitClover > 0){
      for(var i=0;i < failureUnitClover;i++){
        unitJsonResult.testsuite.testcase.push(FAILURE_TO_WRITE);
      }
    }
    if(successUnitClover > 0){
      for(var j=0;j< successUnitClover;j++){
          unitJsonResult.testsuite.testcase.push(SUCCESS_TO_WRITE);
      }
    }
    console.log(successlintcount);
    if(successlintcount > 0){
        for(let i=0;i<successlintcount;i++){
            unitJsonResult.testsuite.testcase.push(SUCCESS_ESLINT_TO_WRITE);
      }
    }     

    if(failurelintCount > 0){
        for(let i=0;i<failurelintCount;i++){
            unitJsonResult.testsuite.testcase.push(FAILURE_ESLINT_TO_WRITE);

      }
    }

    return unitJsonResult;
}