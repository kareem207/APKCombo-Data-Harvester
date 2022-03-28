const request = require('request-promise');
const cheerio = require('cheerio');
const pretty = require("pretty");
const csvwriter = require('csv-writer');
const Nightmare = require('nightmare');
const nightmare = Nightmare({show: false});



//app host name
const hostName = "https://apkcombo.com/";

const category = ['game','app'];
const sectorAndPageNum = [['latest-updates',50],['top-free',17],['top-trending',17]];
const nothalf = [['hot',30],['top-popular',50],['latest-updates',50],['top-free',17],['top-trending',17],['top-grossing',17],['new-releases',50],['top-new-free',17]];

var json = sectorAndPageNum.map(function (value, key) {
  return {
      "sector": value[0],
      "PageN": value[1]
  }
});


async function downloadURL(appURL){
  let returnData='';

  try {
  await nightmare
  .goto(appURL)
  .wait("#best-variant-tab>.tree>ul>li>ul>li>a")
  .evaluate(() => document.querySelector('body').outerHTML)
  .then(function (html) {
    let $= cheerio.load(html);
    returnData =  pretty( $("*").find('a.variant').attr('href') )
  })} catch (err) {
  console.log(err);
  }

  return returnData;


}



async function ApplicationPage(appURL){
  const loadPage = await request.get(appURL)
  const $ = cheerio.load(loadPage)
  let downloadPageURL = hostName + $("a.button.is-success.is-fullwidth").attr('href')
  return await downloadURL( downloadPageURL )
}


async function HomePageScraping(category,sector,pageNum){
  const pageUrl = hostName + 'category' + '/' + category +'/' + sector + '/?page=' + pageNum
  const loadPage = await request.get(pageUrl); 
  const $ = cheerio.load(loadPage);
  const itemsInList = $("div.content.content-apps>a.l_item");
  let ApplicationData = [];

  itemsInList.each( function (idx, el) {
    let AppURL = hostName + $(el).attr('href');
    let AppName = $(el).find(".info>.name").text();
    let AppAuthor = $(el).find(".info>.author").text();
    let AppSize = $(el).find(".info>.description>span.ltr").text();
    data = {
      AppURL:AppURL,
      AppName:AppName,
      AppAuthor:AppAuthor,
      AppSize:AppSize
    };
    ApplicationData.push(data);
  });
  return ApplicationData;

}

async function main(){

  let tempFullData=[];
    for (let metaData of json){
      let x=0;
        for (let pageCounter=1; pageCounter<=metaData.PageN ; pageCounter++){
          let loopedData = await HomePageScraping(category[0],metaData.sector,pageCounter);
            for(let i=0; i<loopedData.length; i++){
              let url = loopedData[i].AppURL;
              let temp = await ApplicationPage(url);
              loopedData[i].AppURL = temp;
              loopedData[i].category = category[0];
              tempFullData.push(loopedData[i]);
              console.log("Normal counter : "+i);
              console.log("total apps : "+x);
              x++;
            }
            console.log("Page Number"+ pageCounter+ "--- Sector " + metaData.sector + "--- Category "+ category[0] );

          }
      }
    var createCsvWriter = csvwriter.createObjectCsvWriter;
    const csvWriter = createCsvWriter({
    
      // Output csv file name is geek_data
      path: 'collectedDataNewGame2.csv',
      header: [
      
        // Title of the columns (column_names)
        {id: 'AppURL', title: 'AppURL'},
        {id: 'AppName', title: 'AppName'},
        {id: 'AppAuthor', title: 'AppAuthor'},
        {id: 'category', title: 'category'},
        {id: 'AppSize', title: 'AppSize'},
      ]
    });
  
    csvWriter
    .writeRecords(tempFullData)
    .then(()=> console.log('Data uploaded into csv successfully'));
    
  
    console.log(tempFullData);
  
}

main()
