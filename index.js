const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cnynjvo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const eventsCollection = client.db('greenOrganization').collection('events');
        const volunteerCollection = client.db('greenOrganization').collection('volunteerInfo');

        // load data from mongodb
        app.get('/event', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = eventsCollection.find(query);
            console.log(cursor);
            let events;

            if (page || size) {
                events = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                events = await cursor.toArray();
            }
            res.send(events);
        });

        // load data to mongodb
        app.post('/event', async (req, res) => {
            const newEvent = req.body;
            const result = await eventsCollection.insertOne(newEvent);
            res.send(result);
        });

        app.get('/event/:eventId', async (req, res) => {
            const id = req.params.eventId;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const event = await eventsCollection.findOne(query);
            res.send(event);
        });

        // load volunteer information to volunteerInfo
        app.post('/volunteer', async (req, res) => {
            const newVolunteer = req.body;
            const result = await volunteerCollection.insertOne(newVolunteer);
            res.send(result);
        });

        // load volunteer information from volunteerInfo
        app.get('/volunteer', async (req, res) => {
            const query = {};
            const cursor = volunteerCollection.find(query);
            const volunteers = await cursor.toArray();
            res.send(volunteers);
        });

        // deleting event from volunteerInfo
        app.delete('/volunteer/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await volunteerCollection.deleteOne(query);
            res.send(result);
        });

        // count the events number
        app.get('/eventscount', async (req, res) => {
            const count = await eventsCollection.countDocuments();
            res.send({ count });
        });
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running green organization server');
});

app.listen(port, () => {
    console.log('listening to port', port);
});
