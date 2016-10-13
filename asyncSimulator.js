
function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

function asyncSimulator(var_in, callback) {
        var delay = Math.round(Math.random() * 2000);
        setTimeout((v)=>{
                console.log('asyncSimulator called in ', delay, ' ms. Message: ', v);
                callback(v)
            },
            delay, var_in
        );
}

exports.range = range;
exports.asyncSimulator = asyncSimulator;