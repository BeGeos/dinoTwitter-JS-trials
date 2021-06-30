const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// DB Schema
mongoose.connect(
  process.env.MONGO_DB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
  () => console.log("Connected to DB!")
);
const { Schema } = mongoose;

const roarSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  created: Date,
  tags: [String],
});

const Roar = mongoose.model("Roar", roarSchema);

// Order in order of date when JSON is sparse e.g.: tags
function dateOrderResponse(data) {
  return data
    .sort(function (a, b) {
      return new Date(a.created) - new Date(b.created);
    })
    .reverse();
}

// Routes

app.get("/", (req, res) => {
  res.status(200);
  res.json({
    message: "Yoo roarrr 🦕",
  });
});

function isValidRoar(roar) {
  return (
    roar.name &&
    roar.name.toString().trim() !== "" &&
    roar.content &&
    roar.content.toString().trim() !== ""
  );
}

function exctractTags(text) {
  return text.match(/#([a-z0-9]{1,30})/gi);
}

app.post("/roars/test", (req, res) => {
  let author = req.query.name;
  if (req.query.name) {
    Roar.find({ name: author })
      .sort({ created: -1 })
      .exec(function (err, roars) {
        if (err) {
          res.status(500);
          res.json({ error: err });
        } else {
          res.status(200);
          res.json({ roars });
        }
      });
  } else {
    res.status(422);
    res.json({ message: "No query found!" });
  }
});

app.post("/roars", (req, res) => {
  if (isValidRoar(req.body)) {
    let tags = exctractTags(req.body.content.toString());

    // insert into db
    const roar = new Roar({
      name: req.body.name.toString(),
      content: req.body.content.toString(),
      created: new Date(),
      tags: tags,
    });

    roar.save((err, data) => {
      if (err) {
        res.json({
          error: err,
        });
      } else {
        // console.log("saved to DB");
        res.json({ data });
      }
    });

    // console.log(roar);
  } else {
    // trhow error
    res.status(422);
    res.json({
      message: "Name and content are required",
    });
  }
});

app.get("/roars", (req, res) => {
  Roar.find({})
    .sort({ created: -1 })
    .exec(function (err, roars) {
      if (err) {
        res.json({ error: err });
      } else {
        res.json({ roars });
      }
    });
});

app.get("/roars/tags", async (req, res) => {
  if (req.query.tags) {
    let tags = req.query.tags.split(",").map((tag) => "#" + tag.trim());
    // console.log(tags);
    let promises = new Array();
    let roars = new Array();
    let ids = new Array();

    tags.forEach((tag) => {
      promises.push(
        Roar.find({ tags: { $all: tag } })
          .then(function (data) {
            if (data.length > 0) {
              data.forEach((datum) => {
                if (!ids.includes(datum._id.toString())) {
                  ids.push(datum._id.toString());
                  // console.log(ids);
                  roars.push(datum);
                }
              });
            }
          })
          .catch((err) => res.json({ error: err }))
      );
    });

    Promise.all(promises).then(() => {
      // console.log(roars);
      roars = dateOrderResponse(roars);
      res.json({ roars });
    });
  } else {
    res.status(422);
    res.json({ message: "No query found!", roars: [] });
  }
});

app.get("/roars/author", (req, res) => {
  let author = req.query.name;
  if (req.query.name) {
    Roar.find({ name: author })
      .sort({ created: -1 })
      .exec(function (err, roars) {
        if (err) {
          res.status(500);
          res.json({ error: err });
        } else {
          res.status(200);
          res.json({ roars });
        }
      });
  } else {
    res.status(422);
    res.json({ message: "Name required" });
  }
});

// app.delete("/roars/delete", (req, res) => {
//   Roar.deleteMany({}, () => {
//     res.status(200).json({ message: "All roars deleted" });
//   });
// });

app.listen(5000, () => {
  console.log("Listening on port http://localhost:5000");
});
