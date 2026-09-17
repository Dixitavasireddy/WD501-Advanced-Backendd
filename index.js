const http = require("http");
const fs = require("fs");

const port = process.argv[2]
  ? Number(process.argv[2].split("=")[1])
  : 5000;

const server = http.createServer((req, res) => {
  let file;

  if (req.url === "/" || req.url === "/home") {
    file = "home.html";
  } else if (req.url === "/project") {
    file = "project.html";
  } else if (req.url === "/registration") {
    file = "registration.html";
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page Not Found");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});