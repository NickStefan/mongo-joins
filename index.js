var async = require('async');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var url = 'mongodb://localhost:27017/mongojoins';

async.auto({
  // CONNECT TO A DB
  db: function(done){
    MongoClient.connect(url, done);
  },

  // CLEAR ANY OLD STUFF
  dbClear: ['db', function(done, results){
    results.db.collection('content').drop(function(err, results){
      done();
    });
  }],

  // INSERT SOME IMAGES
  insertImages: ['dbClear', function(done, results){
    results.db.collection('content')
    .insertMany([
      {
        type: 'Image',
        name: 'Golden Fields Closeup',
        url: 'https://static.pexels.com/photos/59498/pexels-photo-59498.jpeg'
      },
      {
        type: 'Image',
        name: 'Green Fields Closeup',
        url: 'https://static.pexels.com/photos/34021/pexels-photo.jpg'
      },
      {
        type: 'Image',
        name: 'Stump at Sunset',
        url: 'https://static.pexels.com/photos/1564/dawn-nature-sunset-dust.jpg'
      }
    ], done);
  }],

  // QUERY THE IMAGES FOR THE IDs
  queryImages: ['insertImages', function(done, results){
    results.db.collection('content')
    .find()
    .toArray(done);
  }],

  // CREATE A PAGE WITH SOME IMAGE IDs
  insertPage: ['queryImages', function(done, results){
    var parent = new ObjectID();
    var leftChild = new ObjectID();
    var middleChild = new ObjectID();
    var rightChild = new ObjectID();

    results.db.collection('content')
    .insertOne({
      type: 'Page',
      nodes: [
        {
          _id: parent,
          parent_id: null,
          next_id: null,
          previous_id: null,
          view: 'section'
        },
        {
          _id: leftChild,
          previous_id: null,
          next_id: middleChild,
          parent_id: parent,
          view: 'image',
          props: {
            image_id: results.queryImages[0]._id
          }
        },
        {
          _id: middleChild,
          previous_id: leftChild,
          next_id: rightChild,
          parent_id: parent,
          view: 'image',
          props: {
            image_id: results.queryImages[1]._id
          }
        },
        {
          _id: rightChild,
          previous_id: middleChild,
          next_id: null,
          parent_id: parent,
          view: 'image',
          props: {
            image_id: results.queryImages[2]._id
          }
        }
      ]
    }, done);
  }],

  // QUERY A PAGE WITH POPULATED IMAGES
  // IN ONE QUERY!
  query: ['insertPage', function(done, results){
    results.db.collection('content')
    .aggregate([
      {
        '$match': {type: 'Page'}
      },
      {
        '$unwind': '$nodes'
      },
      {
        '$lookup':{
          from: 'content',
          localField: 'nodes.props.image_id',
          foreignField: '_id',
          as: 'nodes.props.image'
        }
      },
      {
        '$unwind': '$nodes.props.image'
      },
      {
        '$group': {
          _id: '$_id',
          nodes: {
            '$push': '$nodes'
          }
        }
      }
    ], done);
  }]
}, function(err, results){
  if (err){
    return console.log(err);
  }
  console.log(JSON.stringify(results.query, null, 4));
  results.db.close();
});