const mongodb = require('../data/database');
const dotenv = require('dotenv');
const createError = require('http-errors');
const apiKeyGen = require('../tools/api-key-gen');
const sendNotification = require('../tools/ntfy');

dotenv.config();

const storeCollection = 'stores';
const ObjectId = require('mongodb').ObjectId;

const getStore = async (req, res, next) => {
  try {
    // swagger-tags=['Stores']
    let db = mongodb.getDb();
    const id = req.params.id;
    const result = await db.collection(storeCollection).find({ _id: new ObjectId(id) });
    const stores = await result.toArray();

    if(req.params.validation){
      return
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(stores[0]); 
  } catch (err) {
    throw res.json(createError(500, err.message));
  }
};

const getStores = async (req, res, next) => {
  try {
    // swagger-tags=['Stores']
    let db = mongodb.getDb();
    const result = await db.collection(storeCollection).find();
    const stores = await result.toArray();

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(stores);
  } catch (err) {
    throw res.json(createError(500, err.message));
  }
};

const updateStore = async (req, res, next) => {
  try {
    // swagger-tags=['Stores']
    let db = mongodb.getDb();
    const id = req.params.id;
    const store = req.body;
    const result = await db.collection(storeCollection).find({ _id: new ObjectId(id) });
    const stores = await result.toArray();

    if (stores.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    await db.collection(storeCollection).updateOne({ _id: new ObjectId(id) }, { $set: store });
    res.setHeader('Content-Type', 'application/json');
    return res.status(204).json(store);
  } catch (err) {
    sendNotification(err, 'system_error');
    return res.status(500).json({ message: err.message });
  }
};

const createStore = async (req, res, next) => {
  try {
    // swagger-tags=['Stores']
    let db = mongodb.getDb();
    let store = req.body;

    store.api_key = apiKeyGen();
    store.created_at = new Date();
    store.status = store.status || 'open';

    await db.collection(storeCollection).insertOne(store);

    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(store);
  } catch (err) {
    sendNotification(err, 'system_error');
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const deleteStore = async (req, res, next) => {
  try {
    // swagger-tags=['Stores']
    let db = mongodb.getDb();
    const id = req.params.id;
    await db.collection(storeCollection).deleteOne({ _id: new ObjectId(id) });

    res.setHeader('Content-Type', 'application/json');
    res.status(204).send();
  } catch (err) {
    sendNotification(err, 'system_error');
    throw res.json(createError(500, err.message));
  }
};

module.exports = {
  getStore,
  getStores,
  updateStore,
  createStore,
  deleteStore,
};
