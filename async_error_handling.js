"use strict";

// Ask not waht the callback can do for you,
// ask what the callback has just done.

const fs    = require('fs');
const util  = require('util');
const EventEmitter = require('events');

const async = require('./asyncSimulator.js');
const range = async.range;
const asyncSimulator = async.asyncSimulator;

partialParallel2(); 

function partialParallel2() {
    const taskLimit = 4;
    var   activeTasks = 0;
    var   completedTaskCount = 0;

    var sum = 0;

    var tasks = range(0,20,1);
    const tasks_length = tasks.length;

    const ppEE = new EventEmitter();

    ppEE.on('start',        startTasks);
    ppEE.on('taskDone',     processResult);
    ppEE.on('resultDone',   checkMoreTask);
    ppEE.on('moreTask',     nextTask);
    ppEE.on('allDone',      endTask);
    ppEE.on('ERROR',        errorHandle);
    ppEE.on('errorDone',    checkMoreTask);

    start();

    function errorHandle(v) {
        console.log('---------> Subtask %d had an error. skip the result and continue.', v);
        ppEE.emit('errorDone');
    }

    function start(){
        ppEE.emit('start', 'To start the sequence');
    }

    function startTasks() {
       if( tasks.length == 0) {
            ppEE.emit('allDone')
            return;
       }
       for (var i = 0; i< Math.min(taskLimit, tasks_length); i++) {
            nextTask();
       }
    }

    function checkMoreTask() {
       console.log(activeTasks, ' are running');
       if( tasks.length == 0 ) {
           if(activeTasks == 0 ) 
                ppEE.emit('allDone');
           return;
       }
       ppEE.emit('moreTask');
    }


    function nextTask() {
            var t = tasks.shift();
            if(t==10) {
                ppEE.emit('ERROR', t);
                return;
            }
            activeTasks ++;
            asyncSimulator(t, (v)=>{
                activeTasks --;
                if( v == 10) {
                    ppEE.emit('ERROR', v);  //simulate an exception here
                } else {
                    ppEE.emit('taskDone', v)
                }
            })
    }

    function processResult(v) {
        sum += v;
        completedTaskCount ++;
        console.log('current sum = %d  completed = %d', sum, completedTaskCount);
        ppEE.emit('resultDone');
    }

    function endTask() {
        console.log("All Done! The sum is %d", sum)
    }

}