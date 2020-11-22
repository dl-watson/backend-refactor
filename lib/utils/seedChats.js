// helper function that will take in the /meetings endpoint obj.body and returns an array of download_urls matching the filter conditions

// const { default: fetch } = require("node-fetch");
const nfetch = require("node-fetch");
const client = require("../client");

// this code is for the db array solution
module.exports = async (obj) => {
  for (let child of obj) {
    const uuid = child.uuid;
    let urlArray = [];
    urlArray.push(child.chat_file);

    await parseChatData(urlArray, uuid);
  }
};

// parse all chat data, seed into database as stringified arrays
async function parseChatData(urls, uuid) {
  try {
    const responses = await Promise.all(urls.map((x) => nfetch(x)));
    const texts = await Promise.all(responses.map((res) => res.text()));

    const uuidArray = [];
    const timestampArray = [];
    const speakerArray = [];
    const textArray = [];

    for (let chatString of texts) {
      let split = chatString.split("\n");
      for (let line of split) {
        let linesplit = line.split("\t");

        uuidArray.push({
          uuid: uuid,
        });
        timestampArray.push({
          timestamp: linesplit[0] || "",
        });
        speakerArray.push({
          speaker: linesplit[1] || "",
        });
        textArray.push({
          text: linesplit[2] || "",
        });
      }
    }

    seedChatData(uuidArray, timestampArray, speakerArray, textArray);
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}

// bulk insert chat array into database
async function seedChatData(
  uuidArray,
  timestampArray,
  speakerArray,
  textArray
) {
  try {
    await client.query(
      `
        INSERT INTO chats
        (uuid, timestamp, speaker, text)
        VALUES
        ($1, $2, $3, $4)
      `,
      [
        JSON.stringify(uuidArray),
        JSON.stringify(timestampArray),
        JSON.stringify(speakerArray),
        JSON.stringify(textArray),
      ]
    );
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}
