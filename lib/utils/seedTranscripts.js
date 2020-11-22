/* eslint-disable no-inner-declarations */
// helper function that will take in the /meetings endpoint obj.body and returns an array of download_urls matching the filter conditions

// const { text } = require("express");
const nfetch = require("node-fetch");
const webvtt = require("node-webvtt");
const client = require("../client");

module.exports = async (obj) => {
  for (let child of obj) {
    const uuid = child.uuid;
    let urlArray = [];
    // need a way to account for transcript_url === ""
    urlArray.push(child.transcript_url);

    await parseTranscriptData(urlArray, uuid);
  }
};
/*
  {
    'id': 1,
    'uuid': 'Won0eAuoTPKxsybU0rGkag==',
    'identifier': '1',
    'time_start': 2.939,
    'time_end': 4.859,
    'speaker': '',
    'text': 'Ryan Mehta: Okay, so',
    'keywords': 'keywords'
  },

*/

// function formatUrl(url) {
//   return `${url}?access_token=${zoom_token}`;
// }

async function parseTranscriptData(urls, uuid) {
  try {
    // handling for when a video does not have a transcript
    const responses = await Promise.all(
      urls.map((x) => {
        if (x) {
          return nfetch(x);
        } else {
          return "";
        }
      })
    );

    const texts = await Promise.all(
      responses.map((res) => {
        if (res) {
          return res.text();
        } else {
          return "";
        }
      })
    );

    const parsed = texts.map((text) => {
      if (text) {
        return webvtt.parse(text, { strict: false });
      } else {
        return "";
      }
    });

    const parsedArr = parsed.map((data) => data.cues);

    const uuidArray = [];
    const identifierArray = [];
    const timeStartArray = [];
    const timeEndArray = [];
    const speakerArray = [];
    const textArray = [];
    const keywordsArray = [];

    for (let cues of parsedArr) {
      for (let data of cues) {
        uuidArray.push({
          uuid: uuid,
        });
        identifierArray.push({
          identifier: data.identifier,
        });
        timeStartArray.push({
          time_start: data.start,
        });
        timeEndArray.push({
          time_end: data.end,
        });
        speakerArray.push({
          speaker: "",
        });
        textArray.push({
          text: data.text,
        });
        keywordsArray.push({
          keywords: "keywords",
        });
      }
    }

    // -----------------

    function chunkArray(perChunk, inputArray) {
      return inputArray.reduce((arr, item, index) => {
        const chunkIndex = Math.floor(index / perChunk);

        if (!arr[chunkIndex]) {
          arr[chunkIndex] = [];
        }

        arr[chunkIndex].push(item);

        return arr;
      }, []);
    }

    // ---------------------

    const uuidChunk = chunkArray(100, uuidArray);
    const identifierChunk = chunkArray(100, identifierArray);
    const timeStartChunk = chunkArray(100, timeStartArray);
    const timeEndChunk = chunkArray(100, timeEndArray);
    const speakerChunk = chunkArray(100, speakerArray);
    const textChunk = chunkArray(100, textArray);
    const keywordsChunk = chunkArray(100, keywordsArray);

    // ---------------------

    let chunks = [];
    chunks.push(uuidChunk); // chunks[0]
    chunks.push(identifierChunk); // chunks[1]
    chunks.push(timeStartChunk); // chunks[2]
    chunks.push(timeEndChunk); // chunks[3]
    chunks.push(speakerChunk); // chunks[4]
    chunks.push(textChunk); // chunks[5]
    chunks.push(keywordsChunk); // chunks[6]

    function sortedArrays(chunks) {
      let arr = [];
      for (let i = 0; i < chunks.length; i++) {
        const idx = chunks[i];
        arr.push(idx[i]);
      }
      return arr;
    }

    const fnChunks = sortedArrays(chunks);

    // returns an array of only uuid arrays, in 100 line chunks
    // console.log(fnChunks[0]);

    // -------------------

    // in order for bulk inserts to work, arrays must be in this form:

    // INSERT INTO table (col1, col2, col3)
    // VALUES
    // (row1_val1, row1_val2, row1_val3),
    // (row2_val1, row2_val2, row2_val3),
    // (row3_val1, row3_val2, row3_val3);

    // ---------------------

    seedTranscriptData(fnChunks);
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}

async function seedTranscriptData(chunks) {
  try {
    await client.query(
      `
        INSERT INTO transcripts
        (uuid, identifier, time_start, time_end, speaker, text, keywords)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        JSON.stringify(chunks[0]),
        JSON.stringify(chunks[1]),
        JSON.stringify(chunks[2]),
        JSON.stringify(chunks[3]),
        JSON.stringify(chunks[4]),
        JSON.stringify(chunks[5]),
        JSON.stringify(chunks[6]),
      ]
    );
  } catch (e) {
    console.log("ERROR***********************");
    console.log(e.message);
  }
}
