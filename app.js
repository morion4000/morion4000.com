var express = require('express');
var request = require('request');
var crequest = require('cached-request')(request);
var compression = require('compression');
var mustacheExpress = require('mustache-express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
var port = process.env.PORT || 3003;

function render_404(req, res) {
  res.status(404).render('404', {
    title: 'Page not found',
    description: 'The page you requested couldn\'t be found.',
    link: 'https://www.morion4000.com',
    keywords: 'software, remote, full stack, web, development, architecture, developer, crypto, web, indie hacker',
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
app.use(bodyParser.urlencoded({ extended: false }));

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

app.post('/send-mail', function(req, res) {
  var response = 'OK';
  var data = {
    to: 'morion4000@gmail.com',
    subject: 'New contact inquery'
  };

  if (req.body && req.body.message && req.body.email) {
    data.text = req.body.message;
    data.from = req.body.email;

    mailgun.messages().send(data);
  } else {
    response = 'There was an error sending the email.';
  }

  res.send(response);
});

app.get('/robots.txt', function(req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow:\nSitemap: https://www.morion4000.com/assets/sitemap.xml");
});

app.get('/', function(req, res) {
  var cookie_notice = show_cookie_notice(req);

  res.render('index', {
    title: 'Adrian Moraru | Web and Blockchain Developer',
    description: 'Seasoned software developer with over ten years of experience in remote full stack web development and systems architecture. I have worked on platforms ranging from mobile to web and desktop.',
    link: 'https://www.morion4000.com',
    keywords: 'software, remote, full stack, web, developer, development, backend, frontend, architecture, blockchain, crypto, web, indie hacker',
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
  res.redirect(301, 'https://old.morion4000.com/hello-world');
});

app.get('/django-settings-for-multiple-environments', function(req, res) {
  res.redirect(301, 'https://old.morion4000.com/django-settings-for-multiple-environments');
});

app.get('/about', function(req, res) {
  res.redirect(301, 'https://old.morion4000.com/about');
});

app.get('/projects', function(req, res) {
  res.redirect(301, 'https://old.morion4000.com/projects');
});

app.get('/tags', function(req, res) {
  res.redirect(301, 'https://old.morion4000.com/tags');
});

app.get('*', render_404);

app.listen(port, function() {
  console.log('morion4000 site listening on port', port);
});
