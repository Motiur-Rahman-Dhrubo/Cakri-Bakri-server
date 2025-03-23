const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lfjkv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const userCollection = client.db("cakriBakriDB").collection("users");
    const jobsCollection = client.db("cakriBakriDB").collection("jobs");
    const applicationCollection = client
      .db("cakriBakriDB")
      .collection("applications");
    const favoriteJobsCollection = client
      .db("cakriBakriDB")
      .collection("favoriteJobs");

    // Auth related APIs
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // --------------------------user related APIs----------------------------------------------------------

    app.get("/users", async (req, res) => {
      console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ messege: "User Already Exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // --------------------------job related APIs----------------------------------------------------------
    // get all jobs
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    // post a job in db
    app.post("/add-job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    // get specific job
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // get specific job
    app.delete("/delete-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    // apply a job
    app.post("/apply-job", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    // ! Applied jobs get operation

    app.get("/applied-jobs", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      // if (req.user?.email !== email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    // ! Favorite jobs post operation

    app.post("/favorite-jobs", async (req, res) => {
      const favoriteJobs = req.body;
      // console.log(favoriteJobs)
      // if (req.body?.jobId == ) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      const result = await favoriteJobsCollection.insertOne(favoriteJobs);
      res.send(result);
    });

    // ! Favorite jobs get operation

    app.get("/favorite-jobs", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await favoriteJobsCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is waiting at: ${port}`);
});
