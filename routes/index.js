var express = require('express');
var router = express.Router();
var crawler = require('../crawler');
var URL = require('url');

/* GET home page. */
router.get('/', function(req, res) {
  var url = 'http://mirlab.org/jang/courses/webProgramming/syllabus.asp';
  if (req.query.url !== undefined) {
    url = req.query.url;
  }
  if (URL.parse(url).protocol === null) {
    url = "http://" + url;
  }
  
  crawler(url, function(sitemap) {
    var urlHash = {}, count = 0, nodes = [];
    sitemap.traverse(function(url, node) {
      if (urlHash[node.data.url] === undefined) {
        urlHash[node.data.url] = count++;
      }
    });
    function traverse(node) {
      if (node.data !== undefined && nodes[urlHash[node.data.url]] === undefined) {
        nodes[urlHash[node.data.url]] = {
          name: urlHash[node.data.url] + ": " + node.data.title,
          linkTo: [],
          url: node.data.url
        };
      }
      
      for (var i in node.children) {
        if (node.data !== undefined && i === node.data.url) continue;
        if (node.data !== undefined) {
          nodes[urlHash[node.data.url]].linkTo.push(urlHash[node.children[i].data.url]);
        }
        traverse(node.children[i]);
      }
    }
    traverse(sitemap);
    
    res.render('index', { title: 'Web Programming Final Project', nodes: nodes });
  });
});

module.exports = router;
