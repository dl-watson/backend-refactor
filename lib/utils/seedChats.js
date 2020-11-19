// helper function that will take in the /meetings endpoint obj.body and returns an array of download_urls matching the filter conditions

// const { default: fetch } = require("node-fetch");
const nfetch = require("node-fetch");
const client = require("../client");
const zoom_token = process.env.zoom_token;

module.exports = async (obj) => {
  for (let child of obj.meetings) {
    const uuid = child.uuid;
    let chat_download_url = "";

    for (let key of child.recording_files) {
      if (key.recording_type === "chat_file") {
        chat_download_url = formatUrl(key.download_url);
      }
      chat_download_url = formatUrl(key.download_url);
    }
    if (chat_download_url) {
      await parseChatData(chat_download_url, uuid);
    }
  }
};

// seed the transcripts
function formatUrl(url) {
  return `${url}?access_token=${zoom_token}`;
}

async function parseChatData(url, uuid) {
  try {
    const request = await nfetch(url);
    const text = await request.text();
    const splitText = text.split("\r\n");
    const uuidArray = [];
    const timestampArray = [];
    const speakerArray = [];
    const textArray = [];
    // console.log(splitText);

    for (let line of splitText) {
      let arr = line.split("\t");
      uuidArray.push({
        uuid: uuid,
      });
      timestampArray.push({
        timestamp: arr[0] || "",
      });
      speakerArray.push({
        speaker: arr[1] || "",
      });
      textArray.push({
        text: arr[2] || "",
      });
    }

    // this is the HUGE bottleneck, solution seems to be to batch an sql insert query
    // for (let data of array) {
    seedChatData(uuidArray, timestampArray, speakerArray, textArray);
    // }
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}

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
      [uuidArray, timestampArray, speakerArray, textArray]
    );
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}
