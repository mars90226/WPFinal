var request = require('request'),
    cheerio = require('cheerio'),
    iconv = require('iconv-lite');
var URL = require('url');
var Sitemap = require('./sitemap');

var maxConnection = 20;

function validUrl(url) {
  if (url === undefined) return false;
  var url = URL.parse(url);
  var path = url.pathname;
  if (path === null) return false;

  path = path.replace(/\?.*$/, "");
  path = path.replace(/\#.*$/, "");
  
  var isHttp = true;
  if (url.protocol !== null && url.protocol !== "http:") isHttp = false;
  return !path.match(/\.(?!(?:html?|php|aspx?)$)[a-z]+$/i) && isHttp;
}

function grabUrl(url, callback) {
  var cache = {};
  var sitemap = new Sitemap.node();
  var jobCount = 0;
  
  function crawl(url) {
    request({
      url: url,
      pool: {
        maxSockets: maxConnection
      }
    }, function(error, response, body) {   
      jobCount--;
      if (!error && response.statusCode == 200) {
        var url = response.request.href;
        url = url.replace(/\?.*$/, "");
        url = url.replace(/\#.*$/, "");
        var $ = cheerio.load(body);
        //if ($("meta[content$='charset=big5']").length > 0) {
        //  $ = cheerio.load(iconv.decode(new Buffer(body), "big5"));
        //}
        
        var title = $('title').text();
        //console.log(url);
        //console.log(jobCount);
        //var count = 0;
        //for (var i in cache) {
        //  count++;
        //}
        //console.log(count);
        
        var parent = sitemap.find(url);
        if (parent === undefined) {
          sitemap.put(url, new Sitemap.node({title: title, url: url}, sitemap));
          parent = sitemap.get(url);
          cache[url] = parent;
        } else {
          parent.data = {title: title, url: url};
        }
        //if (parent.parent !== undefined)
        //  console.log("Children: " + parent.parent.childrenSize());

        $('a').each(function(index, a) {
          //console.log("Href: " + $(a).attr('href'));
          var href = $(a).attr('href');
          var tmpUrl = url;
          if (validUrl(href)) {
            var match1 = href.match(/\.\.\//g);
            tmpUrl = tmpUrl.substring(0, tmpUrl.lastIndexOf('/'));
            if(match1){
              for(var i = 0; i < match1.length; i++){
                tmpUrl = tmpUrl.substring(0, tmpUrl.lastIndexOf('/'));
              }
              tmpUrl = tmpUrl + href.substring(match1.length * 3 - 1);
            } else if(href.match(/^\.\//)){
              tmpUrl = tmpUrl + href.substring(1);
            } else if(href.match(/^\//)){
              tmpUrl = tmpUrl + href.substring(0);
            }else if(href.match(/^\/\//)){
              tmpUrl = tmpUrl + href.substring(1);              
            } else if(href.match(/http:\/\//)){
              tmpUrl = href;
            } else{
              tmpUrl = tmpUrl + '/' + href;
            }
            if(URL.parse(url).host === URL.parse(tmpUrl).host){
              if (cache[tmpUrl] !== undefined) {
                // BUGFIX
                //parent.put(tmpUrl, cache[tmpUrl]);   
              } else {
                jobCount++;
                var node = new Sitemap.node({title: "", url: tmpUrl}, parent);
                parent.put(tmpUrl, node);
                cache[tmpUrl] = node;
                process.nextTick(function(){
                  crawl(tmpUrl);
                });
              }
            }
          }
        });
      }
      if (jobCount === 0) {
        callback(sitemap);
      }
    });
  }
  jobCount++;
  crawl(url);
}

// 'http://mirlab.org/jang/courses/webProgramming/onlineBook.asp'
//grabUrl('http://dict.revised.moe.edu.tw/', function(sitemap) {
//  console.log("In callback");
//  sitemap.traverse(function(url, node) {
//    console.log(url + ": " + node.data.title);
//  });
//});

module.exports = grabUrl;