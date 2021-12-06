const axios = require("axios");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");

require("dotenv").config();
//working port

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(process.env.PORT || 5000, () => "it started");

async function idGenerator() {
  const url = "https://demo-api.gii.cloud/api/oauth/sign";
  const responseUrl = await axios.post(
    url,
    {
      visible_text: "hello",
    },
    {
      auth: {
        username: process.env.DEVCODE_USERNAME,
        password: process.env.DEVCODE_SECRET,
      },
    }
  );
  return responseUrl.data.id;
}

async function hmacGenerator() {
  const secret = process.env.DEVCODE_SECRET;
  const hash = crypto
    .createHmac("sha256", secret)
    // .update("GeeksforGeeks")
    .digest("hex");

  return hash;
}

app.get("/", async (req, res) => {
  const id = await idGenerator();
  const getHash = await hmacGenerator();
  const authUrl =
    "https://demo-api.gii.cloud/api/oauth/auth" +
    "?client_id=eucaps_test" + // your-client is the client ID provided by DID
    "&redirect_uri=" +
    encodeURIComponent("http://localhost:5000/auth") +
    "&response_type=code" +
    "&scope=openid" +
    `&sign_id=${id}` + // ID retrieved from post above
    `&state=${getHash}` + // generate state on your side, using e.g. a HMAC
    "&identity_provider=bankid-se" +
    "&display=popup";

  // res.redirect(authUrl);
  const htmlIframe = `<iframe style="height: 500px; width: 500px" src=${authUrl}></iframe>`;
  const htmlBroilerPlate = `
                            <!DOCTYPE html>
                            <html lang="en">
                              <head>
                                <meta charset="UTF-8" />
                                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                <title>Document</title>
                              </head>
                              <body style="background-color:black; color:white;">
                                <h3>DevCode Identity</h3>
                                ${htmlIframe}
                              </body>
                            </html>
`;
  res.send(htmlBroilerPlate);
});

app.get("/auth", async (req, res) => {
  console.log(req.query);
  res.send("successfully done authentication");
});
