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

  // INSERT SOME TEXT
  insertText: ['insertImages', function(done, results){
    results.db.collection('content')
    .insertMany([
      {
        type: 'Text',
        text: 'Stock photos look nice.',
      },
      {
        type: 'Text',
        text: 'Is there such a thing as stock text?'
      },
      {
        type: 'Text',
        text: 'Lorem Ipsum isn\'t really stock text'
      }
    ], done);
  }],

  // QUERY THE IMAGES FOR THE IDs
  queryImages: ['insertText', function(done, results){
    results.db.collection('content')
    .find({type:'Image'})
    .toArray(done);
  }],

  // QUERY THE TEXT FOR THE IDs
  queryText: ['queryImages', function(done, results){
    results.db.collection('content')
    .find({type: 'Text'})
    .toArray(done);
  }],

  // CREATE A PAGE WITH SOME IMAGE IDs
  insertPage: ['queryText', function(done, results){
    var root = new ObjectID();

    var sectionOne = new ObjectID();
    var sectionTwo = new ObjectID();

    var sectionOneLeftChild = new ObjectID();
    var sectionOneMiddleChild = new ObjectID();
    var sectionOneRightChild = new ObjectID();

    var sectionTwoLeftChild = new ObjectID();
    var sectionTwoMiddleChild = new ObjectID();
    var sectionTwoRightChild = new ObjectID();

    results.db.collection('content')
    .insertOne({
      type: 'Page',
      nodes: [
        {
          _id: root,
          parent_id: null,
          next_id: null,
          previous_id: null
        },
        {
          _id: sectionOne,
          parent_id: root,
          next_id: sectionTwo,
          previous_id: null,
          view: 'section'
        },
        {
          _id: sectionTwo,
          parent_id: root,
          next_id: null,
          previous_id: sectionOne,
          view: 'section'
        },
        {
          _id: sectionOneLeftChild,
          previous_id: null,
          next_id: sectionOneMiddleChild,
          parent_id: sectionOne,
          view: 'image',
          props: {
            image_id: results.queryImages[0]._id
          }
        },
        {
          _id: sectionOneMiddleChild,
          previous_id: sectionOneLeftChild,
          next_id: sectionOneRightChild,
          parent_id: sectionOne,
          view: 'image',
          props: {
            image_id: results.queryImages[1]._id
          }
        },
        {
          _id: sectionOneRightChild,
          previous_id: sectionOneMiddleChild,
          next_id: null,
          parent_id: sectionOne,
          view: 'image',
          props: {
            image_id: results.queryImages[2]._id
          }
        },
                {
          _id: sectionTwoLeftChild,
          previous_id: null,
          next_id: sectionTwoMiddleChild,
          parent_id: sectionTwo,
          view: 'text',
          props: {
            text_id: results.queryText[0]._id
          }
        },
        {
          _id: sectionTwoMiddleChild,
          previous_id: sectionTwoLeftChild,
          next_id: sectionTwoRightChild,
          parent_id: sectionTwo,
          view: 'text',
          props: {
            text_id: results.queryText[1]._id
          }
        },
        {
          _id: sectionTwoRightChild,
          previous_id: sectionTwoMiddleChild,
          next_id: null,
          parent_id: sectionTwo,
          view: 'text',
          props: {
            text_id: results.queryText[2]._id
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
        '$lookup':{
          from: 'content',
          localField: 'nodes.props.text_id',
          foreignField: '_id',
          as: 'nodes.props.text'
        }
      },
      // {
      //   '$unwind': '$nodes.props.image'
      // },
      // {
      //   '$unwind': '$nodes.props.text'
      // },
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