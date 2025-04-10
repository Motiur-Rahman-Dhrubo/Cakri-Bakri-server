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
    const applicationCollection = client.db("cakriBakriDB").collection("applications");
    const favoriteJobsCollection = client.db("cakriBakriDB").collection("favoriteJobs");

    // Auth related APIs
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
          return res.status(401).send({ message: ' Unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
              return res.status(400).send({ message: ' Unauthorized access' })
          }
          req.decoded = decoded;
          next()
      })
  }

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email

      if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'Forbidden access' })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)
      let admin = false
      if (user) {
          admin = user?.role === 'admin'
      }
      console.log(admin)
      res.send({ admin })

  })
  app.get('/user/publisher/:email',verifyToken, async (req, res) => {
    const email = req.params.email
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden access' })
    }
    const query = { email: email }
    const user = await userCollection.findOne(query)
    let publisher = false
    if (user) {
        publisher = user?.role === 'publisher'
    }
    console.log(publisher)
    res.send({ publisher })

})
app.get('/user/seeker/:email', verifyToken, async (req, res) => {
    const email = req.params.email
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden access' })
    }
    const query = { email: email }
    const user = await userCollection.findOne(query)
    let seeker = false
    if (user) {
        seeker = user?.role === 'seeker'
    }
    console.log(seeker)
    res.send({ seeker })

}) 


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
      const newUser ={
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
      const result = await userCollection.insertOne(newUser);
     console.log(result)
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

    // ! Applied jobs get operatio

    app.get("/applied-jobs", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      // if (req.user?.email !== email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    // get specified job update
    app.put("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: {
              ...req.body // Spread the request body to update specific fields
          }
      };
      const result = await jobsCollection.updateOne(query, updateDoc);
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
