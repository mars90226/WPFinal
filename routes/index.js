var express = require('express');
var router = express.Router();
var crawler = require('../crawler');

/* GET home page. */
router.get('/', function(req, res) {
  var url = 'http://mirlab.org/jang/courses/webProgramming/syllabus.asp';
  if (req.query.url !== undefined) {
    url = req.query.url;
  }
  if (!url.match(/^http:\/\//)) {
    url = "http://" + url;
  }
  
  crawler(url, function(sitemap) {
    var results = [], urlHash = {}, count = 0, nodes = [];
    sitemap.traverse(function(url, node) {
      urlHash[url] = count++;
      //results.push([url, node]);
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
          nodes[urlHash[node.data.url]].linkTo.push(urlHash[i]);
        }
        traverse(node.children[i]);
      }
    }
    traverse(sitemap);
    
    //for (var i in results) {
    //  nodes[urlHash[results[i][0]]] = {
    //    name: results[i][1].data.title,
    //    linkTo: [0],
    //    url: results[i][1].data.url
    //  };
    //}
    //
    //for (var i in nodes) {
    //  nodes[i].name = i + ": " + nodes[i].name;
    //}
    
    res.render('index', { title: 'Web Programming Final Project', nodes: nodes });
  });
});

module.exports = router;
