// helper function that will take in the /meetings endpoint obj.body and returns an array of download_urls matching the filter conditions

// const { default: fetch } = require("node-fetch");
const nfetch = require("node-fetch");
const client = require("../client");

module.exports = async (obj) => {
  for (let child of obj) {
    const uuid = child.uuid;
    let urlArray = [];
    urlArray.push(child.chat_file);

    await parseChatData(urlArray, uuid);
  }
};

// seed the transcripts
// async function parseChatData(url, uuid) {
//   try {
//     const request = await nfetch(url);
//     const text = await request.text();
//     const splitText = text.split("\r\n");
//     const array = [];

//     for (let line of splitText) {
//       let arr = line.split("\t");
//       array.push({
//         uuid: uuid,
//         timestamp: arr[0] || "",
//         speaker: arr[1] || "",
//         text: arr[2] || "",
//       });
//     }

//     for (let data of array) {
//       await seedChatData(uuid, data);
//     }
//   } catch (e) {
//     console.log("ERROR***********************");
//     console.log(e.message);
//   }
// }

// async function seedChatData(uuid, data) {
//   try {
//     await client.query(
//       `
//         INSERT INTO chats
//         (uuid, timestamp, speaker, text)
//         VALUES
//         ($1, $2, $3, $4)
//         `,
//       [uuid, data.timestamp, data.speaker, data.text]
//     );
//   } catch (e) {
//     console.log("ERROR***********************");
//     console.log(e.message);
//   }
// }

async function parseChatData(urls, uuid) {
  try {
    const responses = await Promise.all(urls.map((x) => nfetch(x)));
    const texts = await Promise.all(responses.map((res) => res.text()));

    // console.log(texts);
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
