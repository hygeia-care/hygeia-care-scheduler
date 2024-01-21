const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const router = require('../routes/schedulers.js');  
const Scheduler = require('../models/scheduler.js');  
