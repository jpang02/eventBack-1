"use strict";

// Ask not waht the callback can do for you,
// ask what the callback has just done.

const fs    = require('fs');
const util  = require('util');
const EventEmitter = require('events');

const async = require('./asyncSimulator.js');
const range = async.range;
const asyncSimulator = async.asyncSimulator;

partialParallel(); 

function partialParallel() {
    const taskLimit = 3;
    var   activeTasks = 0;

    var tasks = range(0,20,1);
    const tasks_length = tasks.length;

    const ppEE = new EventEmitter();

    ppEE.on('start',       startTasks);
    ppEE.on('taskDone',    checkMoreTask);
    ppEE.on('moreTask',    nextTask);
    ppEE.on('allDone',     endTask);

    start();

    function start(){
        ppEE.emit('start', 0);
    }

    function startTasks() {
       if( tasks.length == 0) {
            ppEE.emit('allDone')
            return;
        }
        for( var i = 0; i< Math.min(tasks_length, taskLimit) ; i++) {
            nextTask();
        }
    }

    function checkMoreTask() {
            if( tasks.length == 0 ) {
                if(activeTasks == 0 ) 
                    ppEE.emit('allDone');
                return;
            }
            ppEE.emit('moreTask');
    }

    function nextTask() {
            var t = tasks.shift();
            activeTasks ++;
            asyncSimulator(t, (v)=>{
                activeTasks --;
                ppEE.emit('taskDone', v)
            })
    }

    function endTask() {
        console.log("All Done!")
    }
 }