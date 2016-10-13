"use strict";

// Ask not waht the callback can do for you,
// ask what the callback has just done.

const fs    = require('fs');
const util  = require('util');
const EventEmitter = require('events');

const async = require('./asyncSimulator.js');
const range = async.range;
const asyncSimulator = async.asyncSimulator;

parentTask();


function parentTask() {
    var total = 0;

    var tasks = range(0,10,1);

    const ptEE = new EventEmitter();

    ptEE.on('start',        nextTask);
    ptEE.on('subTaskDone',  processResult);
    ptEE.on('resultDone',   nextTask);
    ptEE.on('allDone',      endTask);

    start();

    function start(){
        ptEE.emit('start', 'To start the sequence');
    }

    function nextTask() {
            if( tasks.length == 0) {
                ptEE.emit('allDone', total)
                return;
            }
            var t = tasks.shift();
            subTask(t, ptEE, 'subTaskDone');
    }

    function processResult(v) {
        total += v;
        console.log('current total =', total);
        ptEE.emit('resultDone');
    }

    function endTask() {
        console.log("All Done! the total is ", total)
    }

}


function subTask(value, parentEE, doneEvent) {
    var taskLimit = 4;
    var   activeTasks = 0;
    var   completedTaskCount = 0;

    var sum = 0;

    console.log('subTask: ', value);

    var tasks = range(0,value,1);
    const tasks_length = tasks.length;
    console.log(tasks);

    const ppEE = new EventEmitter();

    ppEE.on('start',        startTasks);
    ppEE.on('taskDone',     processResult);
    ppEE.on('resultDone',   checkMoreTask);
    ppEE.on('moreTask',     nextTask);
    ppEE.on('allDone',      endSubTask); 

    start();

    function start(){
        ppEE.emit('start', 'To start the sequence');
    }

    function startTasks() {
       if( tasks.length == 0) {
           ppEE.emit('allDone');
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
            activeTasks ++;
            asyncSimulator(t, (v)=>{
                activeTasks --;
                ppEE.emit('taskDone', v)
            })
    }

    function processResult(v) {
        sum += v;
        completedTaskCount ++;
//        console.log('current sum = %d  completed = %d', sum, completedTaskCount);
        ppEE.emit('resultDone');
    }

    function endSubTask() {
        console.log("Subtask %d Done! The subtotal is %d", value, sum);
        parentEE.emit(doneEvent, sum);
    }

}
