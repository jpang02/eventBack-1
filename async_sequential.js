"use strict";

// Ask not waht the callback can do for you,
// ask what the callback has just done.

const fs    = require('fs');
const util  = require('util');
const EventEmitter = require('events');

const async = require('./asyncSimulator.js');
const range = async.range;
const asyncSimulator = async.asyncSimulator;

sequential();

function sequential()  {
    const seqEE = new EventEmitter();

    seqEE.on('start',       taskOne);
    seqEE.on('taskOneDone', taskTwo);
    seqEE.on('taskTwoDone', taskThree);
    seqEE.on('taskThreeDone', taskEnd);

    start();

    function start(){
        seqEE.emit('start', 0);
    }

    function taskOne(msg) {
        msg += 1;
        asyncSimulator(msg, (m)=>{
            seqEE.emit('taskOneDone', m)
        })
    }

    function taskTwo(msg) {
        msg += 1;
        asyncSimulator(msg, (m)=>{
            seqEE.emit('taskTwoDone', m)
        })
    }

    function taskThree(msg) {
        msg += 1;
        asyncSimulator(msg, (m)=>{
            seqEE.emit('taskThreeDone', m)
        })
    }

    function taskEnd() {
        console.log("All Done!")
    }
}