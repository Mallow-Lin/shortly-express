const parseCookies = (req, res, next) => {
  cookies = {};

  if (req.headers.cookie) {
    var requestCookie = req.headers.cookie.split('; ');
    requestCookie.forEach((cookie) => {
      cookie = cookie.split('=');
      cookies[cookie[0]] = cookie[1];
    });
  }
  req.cookies = cookies;
  next();
};

module.exports = parseCookies;