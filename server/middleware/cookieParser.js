const parseCookies = (req, res, next) => {
  if (req.headers.cookie === undefined) {
    return {};
  }

  var requestCookie = req.headers.cookie;
  requestCookie = requestCookie.split('; ');
  var cookies = {};
  requestCookie.forEach((cookie) => {
    cookie = cookie.split('=');
    cookies[cookie[0]] = cookie[1];
  });
  req.cookies = cookies;
  next();
};

module.exports = parseCookies;