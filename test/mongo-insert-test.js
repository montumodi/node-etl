const etl = require('../index');
const data = require('./data');
const {getCollection, clear} = require('./lib/mongo');
const t = require('tap');
const Promise = require('bluebird');

t.test('mongo.insert', async t => {

  t.teardown(() => clear());
  
  t.test('piping data into mongo.insert',async t => {
    const collection = await getCollection('insert');
    const d = await data.stream()
                    .pipe(etl.mongo.insert(collection,{pushResult:true}))
                    .promise();
    d.forEach(d => t.same(d,{ok:1,n:1},'inserts each record'));
  });

  t.test('mongo collection',async t => {
    const collection = await getCollection('insert');
    const d = await collection.find({},{ projection: {_id:0}}).toArray();

    t.same(d,data.data,'reveals data');
  });

  t.test('pushResults == false and collection as promise',async t => {
    const collection = await getCollection('insert');
    const d = await data.stream(etl.mongo.insert(collection))
                .pipe(etl.mongo.insert(collection))
                .promise();

    t.same(d,[],'returns nothing');
  });

  t.test('error in collection', async t => {
    const collection = Promise.reject({message: 'CONNECTION_ERROR'});
    collection.suppressUnhandledRejections();
    const e = await etl.toStream({test:true})
      .pipe(etl.mongo.update(collection,'_id'))
      .promise()
      .then(() => {throw 'SHOULD_ERROR';}, Object);

    t.same(e.message,'CONNECTION_ERROR','should bubble down');
  });
});

  