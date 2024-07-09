/* Requires */
import express = require("express");
import path = require("path");
import logger = require("morgan");
import fs = require("fs");
import bodyParser = require("body-parser");
import cors = require("cors");

/* Load the proxy middleware plugin */
import httpProxyMiddleware = require("http-proxy-middleware");

module.exports = function (configLocation) {
  /* Config specific routers */
  const elevationRouter = require("./routes/api/elevation")(configLocation);
  const resourcesRouter = require("./routes/resources")(configLocation);

  /* Default routers */
  const airbasesRouter = require("./routes/api/airbases");
  const databasesRouter = require("./routes/api/databases")(
    path.join(
      path.dirname(configLocation),
      "..",
      "Mods",
      "Services",
      "Olympus",
      "databases"
    )
  );
  const indexRouter = require("./routes/index");
  const pluginsRouter = require("./routes/plugins");

  /* Load the config and create the express app */
  let config = {};
  console.log(`Loading configuration file from ${configLocation}`);
  if (fs.existsSync(configLocation)) {
    let rawdata = fs.readFileSync(configLocation, { encoding: "utf-8" });
    config = JSON.parse(rawdata);
  } else {
    console.error("Error loading configuration file.");
    return undefined;
  }

  /* Load the backend address where DCS is listening */
  const backendAddress = config["backend"]["address"];

  /* Start the express app */
  const app = express();

  /* Define middleware */
  app.use(logger("dev"));
  app.use(
    "/olympus",
    httpProxyMiddleware.createProxyMiddleware({
      target: `http://${
        backendAddress === "*" ? "localhost" : backendAddress
      }:${config["backend"]["port"]}/`,
      changeOrigin: true,
    })
  );
  app.use(
    "/vite",
    httpProxyMiddleware.createProxyMiddleware({ target: `http://localhost:8080/`, ws: true })
  );
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cors());

  /* Apply routers */
  app.use("/", indexRouter);
  app.use("/api/airbases", airbasesRouter);
  app.use("/api/elevation", elevationRouter);
  app.use("/api/databases", databasesRouter);
  app.use("/plugins", pluginsRouter);
  app.use("/resources", resourcesRouter);

  return app;
};
