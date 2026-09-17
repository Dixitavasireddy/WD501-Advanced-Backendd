const http = require("http");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const portArg = args.find((arg) => arg.startsWith("--port="));
const PORT = portArg ? Number(portArg.split("=")[1]) : 3000;

const server = http.createServer((req, res) => {
  let fileName;

  if (req.url === "/" || req.url === "/home") {
    fileName = "home.html";
  } else if (req.url === "/project") {
    fileName = "project.html";
  } else if (req.url === "/registration") {
    fileName = "registration.html";
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - Page Not Found");
    return;
  }

  const filePath = path.join(__dirname, fileName);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 - Internal Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});