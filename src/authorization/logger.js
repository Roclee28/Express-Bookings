export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    const colors = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
    };

    let color;
    if (status >= 500) color = colors.red;
    else if (status >= 400) color = colors.yellow;
    else color = colors.green;

    console.log(
      `${color}${method} ${url} - ${status} (${duration}ms)${colors.reset}`
    );
  });

  next();
}
