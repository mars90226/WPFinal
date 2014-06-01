var sitemap = {};
sitemap.node = function(data, parent) {
  this.data = data;
  this.children = {};
  this.parent = parent;
};

sitemap.node.prototype.put = function(key, data) {
  this.children[key] = data;
};

sitemap.node.prototype.get = function(key) {
  return this.children[key];
};

sitemap.node.prototype.childrenSize = function() {
  var count = 0;
  for (var i in this.children) {
    count++;
  }
  return count;
};

sitemap.node.prototype.find = function(key) {
  if (this.children[key] !== undefined) {
    return this.children[key];
  }
  var result = undefined;
  for (var i in this.children) {
    result = this.children[i].find(key);
    if (result !== undefined) {
      return result;
    }
  }
  return result;
};

sitemap.node.prototype.each = function(callback) {
  for (var i in this.children) {
    callback(i, this.children[i]);
  }
};

sitemap.node.prototype.traverse = function(callback) {
  for (var i in this.children) {
    if (this.data !== undefined && i === this.data.url) continue;
    callback(i, this.children[i]);
    this.children[i].traverse(callback);
  }
};

module.exports = sitemap;
