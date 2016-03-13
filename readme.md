# $lookup

Q: Can $lookup cut down on round trips in mongodb?

A: Maybe, if you're joining simple documents. Probably not if you're joining accross embeded documents.

Unfortunately, the $lookup command affects every embedded document, even the ones you don't want it to (thus the empty text and image properties on the root and section). If you attempt to limit who gets affected by $lookup, the aggregation pipeline will only output the ones you affected. It's just the nature of the pipeline treating every previous stage's output as the next's input. 

Hopefully, new additions to MongoDB can make the $lookup more selective.

Document before aggregation:

    {
      type: 'Page',
      nodes: [
        {
          _id: OBJECTIDroot,
          parent_id: null,
          next_id: null,
          previous_id: null
        },
        {
          _id: OBJECTIDsectionOne,
          parent_id: OBJECTIDroot,
          next_id: OBJECTIDsectionTwo,
          previous_id: null,
          view: 'section'
        },
        {
          _id: OBJECTIDsectionTwo,
          parent_id: OBJECTIDroot,
          next_id: null,
          previous_id: OBJECTIDsectionOne,
          view: 'section'
        },
        {
          _id: OBJECTIDsectionOneLeftChild,
          previous_id: null,
          next_id: OBJECTIDsectionOneMiddleChild,
          parent_id: OBJECTIDsectionOne,
          view: 'image',
          props: {
            image_id: OBJECTIDimage
          }
        },
        {
          _id: OBJECTIDsectionOneMiddleChild,
          previous_id: OBJECTIDsectionOneLeftChild,
          next_id: OBJECTIDsectionOneRightChild,
          parent_id: OBJECTIDsectionOne,
          view: 'image',
          props: {
            image_id: OBJECTIDimage
          }
        },
        {
          _id: OBJECTIDsectionOneRightChild,
          previous_id: OBJECTIDsectionOneMiddleChild,
          next_id: null,
          parent_id: OBJECTIDsectionOne,
          view: 'image',
          props: {
            image_id: OBJECTIDimage
          }
        },
        {
          _id: OBJECTIDsectionTwoLeftChild,
          previous_id: null,
          next_id: OBJECTIDsectionTwoMiddleChild,
          parent_id: OBJECTIDsectionTwo,
          view: 'text',
          props: {
            text_id: OBJECTIDtext
          }
        },
        {
          _id: OBJECTIDsectionTwoMiddleChild,
          previous_id: OBJECTIDsectionTwoLeftChild,
          next_id: OBJECTIDsectionTwoRightChild,
          parent_id: sectionTwo,
          view: 'text',
          props: {
            text_id: OBJECTIDtext
          }
        },
        {
          _id: OBJECTIDsectionTwoRightChild,
          previous_id: OBJECTIDsectionTwoMiddleChild,
          next_id: null,
          parent_id: sectionTwo,
          view: 'text',
          props: {
            text_id: OBJECTIDtext
          }
        }
      ]
    }


Aggregation Query:

    db.collection('content')
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
      {
        '$group': {
          _id: '$_id',
          nodes: {
            '$push': '$nodes'
          }
        }
      }
    ], done);



Document after Aggregation: 


    [
        {
            "_id": "56e5f6ad2b5bd899a6a1f3fc",
            "nodes": [
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3f3",
                    "parent_id": null,
                    "next_id": null,
                    "previous_id": null,
                    "props": {
                        "image": [],
                        "text": []
                    }
                },
                {
                    "_id": "56e5fa01faa860eda66e16aa",
                    "parent_id": "56e5fa01faa860eda66e16a9",
                    "next_id": "56e5fa01faa860eda66e16ab",
                    "previous_id": null,
                    "view": "section",
                    "props": {
                        "image": [],
                        "text": []
                    }
                },
                {
                    "_id": "56e5fa01faa860eda66e16ab",
                    "parent_id": "56e5fa01faa860eda66e16a9",
                    "next_id": null,
                    "previous_id": "56e5fa01faa860eda66e16aa",
                    "view": "section",
                    "props": {
                        "image": [],
                        "text": []
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3f6",
                    "previous_id": null,
                    "next_id": "56e5f6ad2b5bd899a6a1f3f7",
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f4",
                    "view": "image",
                    "props": {
                        "image_id": "56e5f6ad2b5bd899a6a1f3ed",
                        "image": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3ed",
                                "type": "Image",
                                "name": "Golden Fields Closeup",
                                "url": "https://static.pexels.com/photos/59498/pexels-photo-59498.jpeg"
                            }
                        ],
                        "text": []
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3f7",
                    "previous_id": "56e5f6ad2b5bd899a6a1f3f6",
                    "next_id": "56e5f6ad2b5bd899a6a1f3f8",
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f4",
                    "view": "image",
                    "props": {
                        "image_id": "56e5f6ad2b5bd899a6a1f3ee",
                        "image": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3ee",
                                "type": "Image",
                                "name": "Green Fields Closeup",
                                "url": "https://static.pexels.com/photos/34021/pexels-photo.jpg"
                            }
                        ],
                        "text": []
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3f8",
                    "previous_id": "56e5f6ad2b5bd899a6a1f3f7",
                    "next_id": null,
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f4",
                    "view": "image",
                    "props": {
                        "image_id": "56e5f6ad2b5bd899a6a1f3ef",
                        "image": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3ef",
                                "type": "Image",
                                "name": "Stump at Sunset",
                                "url": "https://static.pexels.com/photos/1564/dawn-nature-sunset-dust.jpg"
                            }
                        ],
                        "text": []
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3f9",
                    "previous_id": null,
                    "next_id": "56e5f6ad2b5bd899a6a1f3fa",
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f5",
                    "view": "text",
                    "props": {
                        "text_id": "56e5f6ad2b5bd899a6a1f3f0",
                        "image": [],
                        "text": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3f0",
                                "type": "Text",
                                "text": "Stock photos look nice."
                            }
                        ]
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3fa",
                    "previous_id": "56e5f6ad2b5bd899a6a1f3f9",
                    "next_id": "56e5f6ad2b5bd899a6a1f3fb",
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f5",
                    "view": "text",
                    "props": {
                        "text_id": "56e5f6ad2b5bd899a6a1f3f1",
                        "image": [],
                        "text": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3f1",
                                "type": "Text",
                                "text": "Is there such a thing as stock text?"
                            }
                        ]
                    }
                },
                {
                    "_id": "56e5f6ad2b5bd899a6a1f3fb",
                    "previous_id": "56e5f6ad2b5bd899a6a1f3fa",
                    "next_id": null,
                    "parent_id": "56e5f6ad2b5bd899a6a1f3f5",
                    "view": "text",
                    "props": {
                        "text_id": "56e5f6ad2b5bd899a6a1f3f2",
                        "image": [],
                        "text": [
                            {
                                "_id": "56e5f6ad2b5bd899a6a1f3f2",
                                "type": "Text",
                                "text": "Lorem Ipsum isn't really stock text"
                            }
                        ]
                    }
                }
            ]
        }
    ]
