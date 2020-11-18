require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');
// const webvtt = require('node-webvtt');
const seedMeetingData = require('../data/seed-meetings');
const meetingsData = require('../data/meetings');
const transcriptData = require('../data/transcripts');
const favoritesData = require('../data/favorites');

describe('app routes', () => {
  describe('routes', () => {
    let token;

    beforeAll(async(done) => {
      execSync('npm run setup-db');

      client.connect();

      const signInData = await fakeRequest(app).post('/auth/signup').send({
        email: 'jon@user.com',
        password: '1234',
      });

      token = signInData.body.token; // eslint-disable-line

      return done();
    });

    afterAll((done) => {
      return client.end(done);
    });

    test('GET and array of ALL zoom api meeting data and seeds frontend', async() => {
      const expectation = {
        ...seedMeetingData
      };

      const returnedObject = await fakeRequest(app)
        .get('/seed_meetings')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(returnedObject.body).toEqual(expectation);
    });
  });

  test('GET an array of ALL zoom meetings', async() => {

    const expectation = [
      ...meetingsData
    ];

    const returnedObject = await fakeRequest(app)
      .get('/api/transcripts')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  test('GET an array of data for a specfic meeting based on the uuid', async() => {

    const expectation = [
      {
        'uuid': 'Won0eAuoTPKxsybU0rGkag==',
        'host_id': 'Wq3hOAd6QsSDGuYInNBdyw',
        'topic': 'september-2020--Class 38: Full-Stack Auth #full-stack #react #sql #express',
        'start_time': '2020-11-09T17:56:05Z',
        'share_url': 'https://zoom.us/rec/share/mNOSuBf4ILhb7qdymDV5me9JRaHx8jFPCVS4wwC5QnLN3HoqJFsZSDuYGH6yQzYV.FGmUKNceCBT3URkI',
        'duration': 127,
        'video_play_url': 'https://zoom.us/rec/download/BB0W6kaJ4O5cJKVNTVxsdZ6lFgGvHN5XBXDhKwaB2WFs24xAWk1dHIsn9PaIwX6MCv2oJZR_N2syQ-xh.2afo1g09kX7skWXK?access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6InpBSUhwQWpvUlphZWlyVl84V1pUUXciLCJleHAiOjE2MDYxNTk3MDYsImlhdCI6MTYwNTU1NDkwNn0.xByq39Enm7GYd115cGs1tQu4VHtJQ0yvdQUMInPI5eM',
        'audio_play_url': 'https://zoom.us/rec/download/S2B9FCvnQpCqNcYEU5ieTg7S5p9JNSebKz-8pGz9DOPrr_0_fX43D72GeHrEoux-UDZDb-pakJt8yQYE.Tr9zRrq5l-wbqzcr?access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6InpBSUhwQWpvUlphZWlyVl84V1pUUXciLCJleHAiOjE2MDYxNTk3MDYsImlhdCI6MTYwNTU1NDkwNn0.xByq39Enm7GYd115cGs1tQu4VHtJQ0yvdQUMInPI5eM',
        'meeting_views': 0,
        'meeting_fav': 0
      }
    ];

    const returnedObject = await fakeRequest(app)
      .get('/api//meetings/:id')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  // Is this still a real GET? 
  test('GET a transcripts array for ALL meetings', async() => {

    const expectation = [
      //What data array are we actually pulling from?
      ...transcriptData
    ];

    const returnedObject = await fakeRequest(app)
      .get('/api/transcripts')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  test('GET a transcripts array for a uuid specfic meeting', async() => {

    const expectation = [
      ...transcriptData
    ];

    const returnedObject = await fakeRequest(app)
      .get('/api/transcripts/:id')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  test('GET an array of user specific favorites', async() => {

    const expectation = [
      {
        ...favoritesData
      }];
  
    const returnedObject = await fakeRequest(app)
      .post('/api/favorites')
      .send(...favoritesData)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  test('POSTS an array of user specific favorites', async() => {

    const expectation = [
      {
        uuid: 3,
        host_id: 'host_id1',
        topic: 'topic1',
        start_time: 3,
        timestamp: 1000,
        speaker: 'speaker1',
        text: 'text1',
        owner_id: 1
      }];
  
    const returnedObject = await fakeRequest(app)
      .post('/api/favorites')
      .send([
        {
          uuid: 3,
          host_id: 'host_id1',
          topic: 'topic1',
          start_time: 3,
          timestamp: 1000,
          speaker: 'speaker1',
          text: 'text1',
          owner_id: 1
        }])
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  test('DELETES an array of user specific favorites /:id', async() => {

    const expectation = [
      {
        uuid: 2,
        host_id: 'host_id1',
        topic: 'topic1',
        start_time: 2,
        timestamp: 1000,
        speaker: 'speaker1',
        text: 'text1',
        owner_id: 1
      }
    ];

    const returnedObject = await fakeRequest(app)
      .delete('/api/favorites/2')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(returnedObject.body).toEqual(expectation);
  });

  // add test for /api/chat
  // add test for /api/chat/:id


});
