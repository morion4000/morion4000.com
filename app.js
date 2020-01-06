var express = require('express');
var request = require('request');
var crequest = require('cached-request')(request);
var compression = require('compression');
var mustacheExpress = require('mustache-express');
var cookieParser = require('cookie-parser');
var app = express();
var port = process.env.PORT || 3003;

function render_404(req, res) {
  res.status(404).render('404', {
    title: 'Page not found',
    description: 'The page you requested couldn\'t be found.',
    link: 'https://www.morion4000.com',
    keywords: 'software, crypto, web'
  });
}

function show_cookie_notice(req) {
  var show = true;

  if (req.cookies && req.cookies.cookie_notice) {
    show = false;
  }

  return show;
}

crequest.setCacheDirectory('tmp');

app.engine('html', mustacheExpress());

app.use(compression());
app.use(cookieParser());

// CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  next();
});

// Pre-flight and ELB requests
app.options('*', function(req, res) {
  res.send(200);
});

app.get('/*', function(req, res, next) {
  if (req.url.indexOf('/assets/') === 0) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }

  next();
});

app.use('/assets', express.static('assets'));

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.all(/.*/, function(req, res, next) {
  var host = req.header('host');

  console.log(req.method, req.url);

  if (host.match(/^www\..*/i) || host.match(/^localhost*/i)) {
    next();
  } else {
    var url = req.url || '';

    res.redirect(301, 'https://www.' + host + url);
  }
});

app.get('/robots.txt', function(req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow:\nSitemap: https://www.morion4000.com/assets/sitemap.xml");
});

app.get('/', function(req, res) {
  var cookie_notice = show_cookie_notice(req);

  res.render('index', {
    title: 'morion4000',
    description: 'Web and Blockchain developer.',
    link: 'https://www.morion4000.com',
    keywords: 'software, crypto, web',
    cookie_notice: cookie_notice,
  });
});

// The file is also accessible via /assets/sitemap.xml
app.get('/sitemap.xml', function(req, res) {
  res.sendFile('sitemap.xml', {
    root: __dirname + '/assets/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  });
});

app.get('/hello-world', function(req, res) {
  res.redirect(301, 'https://www.morion4000.com/blog');
});

app.get('/django-settings-for-multiple-environments', function(req, res) {
  res.redirect(301, 'https://www.morion4000.com/blog');
});

app.get('/about', function(req, res) {
  res.redirect(301, 'https://www.morion4000.com/services/maintenance');
});

app.get('/projects', function(req, res) {
  res.redirect(301, 'https://www.morion4000.com/projects');
});

app.get('*', render_404);

app.listen(port, function() {
  console.log('morion4000 site listening on port', port);
});
