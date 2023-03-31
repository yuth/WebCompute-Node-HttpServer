const http = require("http");
const querystring = require("querystring");

// Make sure commands gracefully respect termination signals (e.g. from Docker)
// Allow the graceful termination to be manually configurable
if (!process.env.NEXT_MANUAL_SIG_HANDLE) {
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}

const tryParse = (input) => {
  try {
    return JSON.parse(input);
  } catch (err) {
    return null;
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(`http://localhost:3000${req.url}`);
    const queryParams = querystring.parse(url.search.slice(1));

    // Get the request body
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const parts = {
        path: url.pathname,
        queryString: url.search,
        queryParams,
        method: req.method,
        headers: req.headers,
        httpVersion: req.httpVersion,
        body: tryParse(body) || body,
      };

      console.log("Received request", JSON.stringify(parts));
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(parts));
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("internal server error");
  }
});

const currentPort = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "localhost";

server.listen(currentPort, (err) => {
  if (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }

  console.log(
    "Listening on port",
    currentPort,
    "url: http://" + hostname + ":" + currentPort
  );
});
