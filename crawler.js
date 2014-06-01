var request = require('request'),
    cheerio = require('cheerio');
var URL = require('url');
var Sitemap = require('./sitemap');

function validUrl(url) {
  if (url === undefined) return false;
  var path = URL.parse(url).pathname;
  if (path === null) return false;

  path = path.replace(/\?.*$/, "");
  path = path.replace(/\#.*$/, "");
  return !path.match(/\.(?!(?:html?|php|aspx?)$)[a-z]+$/i);
}

function grabUrl(url, callback) {
  var cache = {};
  var sitemap = new Sitemap.node();
  var jobCount = 0;
  
  function crawl(url) {      
    request(url, function(error, response, body) {   
      jobCount--;
      if (!error && response.statusCode == 200) {
        var url = response.request.href;
        url = url.replace(/\?.*$/, "");
        url = url.replace(/\#.*$/, "");
        var $ = cheerio.load(body);
        var title = $('title').text();
        
        var parent = sitemap.find(url);
        if (parent === undefined) {
          sitemap.put(url, new Sitemap.node({title: title, url: url}, sitemap));
          parent = sitemap.get(url);
          cache[url] = parent;
        } else {
          parent.data = {title: title, url: url};
        }

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
            } else if(href.match(/:\/\//)){
              tmpUrl = href;
            } else{
              tmpUrl = tmpUrl + '/' + href;
            }
            if(URL.parse(url).host === URL.parse(tmpUrl).host){
              if (cache[tmpUrl] !== undefined) {
                parent.put(tmpUrl, cache[tmpUrl]);   
              } else {
                jobCount++;
                var node = new Sitemap.node({title: "", url: tmpUrl}, parent);
                parent.put(tmpUrl, node);
                cache[tmpUrl] = node;
                crawl(tmpUrl);
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

//crawl('http://mylifestyle.pixnet.net/blog/post/26771428');
//grabUrl('http://mirlab.org/jang/courses/webProgramming/onlineBook.asp', function(sitemap) {
//  console.log("In callback");
//  sitemap.traverse(function(url, node) {
//    console.log(url + ": " + node.data.title);
//  });
//});

module.exports = grabUrl;