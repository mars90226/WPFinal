var request = require('request'),
    cheerio = require('cheerio'),
    async = require('async');
var URL = require('url');
var Sitemap = require('./sitemap');

var cache = {};

var sitemap = new Sitemap.node();

function validUrl(url) {
  if (url === undefined) return false;
  var path = URL.parse(url).pathname;
  if (path === null) return false;

  path = path.replace(/\?.*$/, "");
  path = path.replace(/\#.*$/, "");
  return !path.match(/\.(?!(?:html?|php|aspx?)$)[a-z]+$/i);
}

function crawl(url) {
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var url = response.request.href;
      var $ = cheerio.load(body);
      var title = $('title').text();

      var parent = sitemap.find(url);
      if (parent === undefined) {
        sitemap.put(url, new Sitemap.node(title, sitemap));
        parent = sitemap.get(url);
        cache[url] = parent;
      } else {
        parent.data = title;
      }

      $('a').each(function(index, a) {
        var url = $(a).attr('href');
        if (validUrl(url)) {
          if (cache[url] !== undefined) {
            parent.put(url, cache[url]);
          } else {
            var node = new Sitemap.node(true, parent);
            parent.put(url, node);
            cache[url] = node;
            crawl(url);
          }
        }
      });
      sitemap.traverse(function(url, node) {
        console.log(url + ": " + node.data);
      });
    }
  });
}
crawl('http://example.com');
