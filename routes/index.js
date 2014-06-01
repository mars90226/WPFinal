var express = require('express');
var router = express.Router();
var crawler = require('../crawler');

/* GET home page. */
router.get('/', function(req, res) {
  crawler('http://mirlab.org/jang/courses/webProgramming/onlineBook.asp', function(sitemap) {
    var results = [], urlHash = {}, count = 0, nodes = [];
    sitemap.traverse(function(url, node) {
      urlHash[url] = count++;
      results.push([url, node]);
    });
    
    for (var i in results) {
      nodes[urlHash[results[i][0]]] = {
        name: results[i][1].data.title,
        linkTo: [0],
        url: results[i][1].data.url
      };
    }
    
    res.render('index', { title: 'Web Programming Final Project', nodes: nodes });
  });
});

module.exports = router;
