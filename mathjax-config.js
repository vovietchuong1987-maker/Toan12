window.MathJax = {
  tex: {
    inlineMath: [['\\(','\\)'], ['$', '$']],
    displayMath: [['\\[','\\]'], ['$$','$$']],
    processEscapes: true,
    packages: {'[+]': ['ams']}
  },
  svg: {fontCache: 'global'},
  options: {
    skipHtmlTags: ['script','noscript','style','textarea','pre','code','select','option']
  }
};
