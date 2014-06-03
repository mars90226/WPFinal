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

  function crawl(url, cut) {
    request({
      url: url,
      encoding: 'binary',
      pool: {
        maxSockets: maxConnection
      }
    }, function(error, response, body) {
      jobCount--;
      if (!error && response.statusCode == 200) {
        var url = response.request.href;
        var keyUrl = url;
        if (keyUrl[keyUrl.length-1] === '/') {
          keyUrl = keyUrl.substring(0, keyUrl.length - 1);
        }
        var $ = cheerio.load(body);

        var title = $('title').text();
        if ($('meta').filter(function() {
          return (/big5$/i).test($(this).attr('content'));
        }).length > 0) {
          //$ = cheerio.load(iconv.decode(new Buffer(body), "big5"));
          //console.log("detect big5");
          title = iconv.decode(title, "big5");
        }
        else {
          title = iconv.decode(title, "utf8");
        }
        //console.log("title: " + title);
        //console.log("Url: " + url);
        //console.log("Cut: " + cut);

        var parent = sitemap.find(keyUrl);
        if (parent === undefined) {
          sitemap.put(keyUrl, new Sitemap.node({title: title, url: keyUrl}, sitemap));
          parent = sitemap.get(keyUrl);
          cache[keyUrl] = parent;
        } else {
          parent.data = {title: title, url: keyUrl};
        }
        //if (parent.parent !== undefined)
        //  console.log("Children: " + parent.parent.childrenSize());

        if (cut !== true) {
          $('a').each(function(index, a) {
            //console.log("Href: " + $(a).attr('href'));
            var href = $(a).attr('href');
            var tmpUrl = url;
            tmpUrl = tmpUrl.replace(/\?.*$/, "");
            tmpUrl = tmpUrl.replace(/\#.*$/, "");
            if (validUrl(href)) {
              var match1 = href.match(/\.\.\//g);
              tmpUrl = tmpUrl.substring(0, tmpUrl.lastIndexOf('/'));
              var prefix = tmpUrl;
              if (match1) {
                for (var i = 0; i < match1.length; i++) {
                  tmpUrl = tmpUrl.substring(0, tmpUrl.lastIndexOf('/'));
                }
                tmpUrl = tmpUrl + href.substring(match1.length * 3 - 1);
              } else if (href.match(/^\.\//)) {
                tmpUrl = tmpUrl + href.substring(1);
              } else if (href.match(/^\//)) {
                var parsedUrl = URL.parse(tmpUrl);
                tmpUrl = parsedUrl.protocol + '//' + parsedUrl.hostname + href;
              } else if (href.match(/^\/\//)) {
                tmpUrl = URL.parse(tmpUrl).protocol + href;
              } else if (href.match(/http:\/\//)) {
                tmpUrl = href;
              } else {
                tmpUrl = tmpUrl + '/' + href;
              }
              var tmpPrefix = tmpUrl.substring(0, tmpUrl.lastIndexOf('/'));
              if (tmpUrl[tmpUrl.length-1] === '/') {
                tmpUrl = tmpUrl.substring(0, tmpUrl.length - 1);
              }
              if (URL.parse(url).host === URL.parse(tmpUrl).host) {
                if (cache[tmpUrl] !== undefined) {
                  parent.put(tmpUrl, cache[tmpUrl]);
                } else {
                  jobCount++;
                  var node = new Sitemap.node({title: "", url: tmpUrl}, parent);
                  parent.put(tmpUrl, node);
                  cache[tmpUrl] = node;
                  process.nextTick(function(){
                    crawl(tmpUrl, prefix !== tmpPrefix);
                  });
                }
              }
            }
          });
        }
      }
      if (jobCount === 0) {
        callback(sitemap);
      }
    });
  }
  jobCount++;
  crawl(url, false);
}

// 'http://mirlab.org/jang/courses/webProgramming/onlineBook.asp'
//grabUrl('http://dict.revised.moe.edu.tw/', function(sitemap) {
//  console.log("In callback");
//  sitemap.traverse(function(url, node) {
//    console.log(url + ": " + node.data.title);
//  });
//});

module.exports = grabUrl;
