# Node.js  EventBack Design Pattern

##Ask not what your callbacks can do for you

##Ask what your callbacks have done for you instead

# My motivations

I love Node.js because of its asynchronous programming. 
But, the love fair is hard to handle.
You may know “callback hell”!
Then, Promise, Stream, generator, coroutine, …!

Do we have a simple and organic asynchronous programming pattern there?

#Paradigm shift with Asynchronous program:

1. No return statement
2. Program flow is based on side effects.
3. Program flow is not linear any more.
4. No call stacks links between aync calls.
5. Very different variable scopes.
6. It is single physical thread with multiple logical flows. Confusing!
7. Events flow instead of calling flow.

#Eventback pattern

Although the function calls are asynchronous, but, the events are sequential.  
Let’s program the events instead.

#Code Pattern

```javascript
Function task() {
	var var1;
	var var2;
	start();

	var event = new EventEmitter();
	event.on(‘Start’, subTaskOne);
	event.on(‘SubTaskOneDone’, subTaskTwo);
	event.on(‘SubTaskTwoDone’, doneFunction);
	event.on(‘Error’, handleErrorFunc);

	function start () {event.emit(‘Start’);}
	function subTaskOne(…) {
		anAsyncCall(…, function cb() {
			event.emit(‘SubTaskOneDone’, resultOne)
		}
	}

	function subTaskTwo() {…}	
	function doneFunction() {…}
	function handleErrorFunction() {…}
	…….
}
```

#What is the different

1. Cut the dependences. 
2. Each subtask reports to event emitter when it has done. It will not dictate the next step. The subTaskOne and subTaskTwo have no direct dependencies.
3. The event emitter will handle subtasks.
4. Error handling is simple and direct.  
5. Programming events instead function calls.


#Parent-child Tasks

```javascript
Function parentTask() {

}

Function childTask(vars, parentEvent) {
…….
	var event = new EventEmitter();
	event.on(‘Done’, ()=>{
		parentEvent.emit(‘ChildDone’, …);
	}	
……..
}
```
# event transition diagram

![alt text][sm]
[sm]: https://www.dropbox.com/s/tkzbvp58qk3l5lo/parallel1.svg "parallel tasks"

