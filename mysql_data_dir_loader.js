"use strict";

const fs    = require('fs');
const util  = require('util');
const cvs   = require('csv-string');
const mysql = require('mysql');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {};

const data_dir = 'c:/home/project/data/';
const blank = /^$/;

const log = console.log;


var connection = mysql.createConnection({
    host:   'data_host',
    user:   'user_name',
    password: 'user_password',
    database: 'user_database'
});

connection.connect();
console.log('db connected!');

process_one_dir(data_dir);

function process_end() {
        console.log('Done all files!');
        connection.end();
        process.exit(0);
}

function process_one_dir(data_dir) {
    var files;
    const dirEE = new MyEmitter();

    dirEE.on('start',      open_dir);
    dirEE.on('filesReady', process_next_file);
    dirEE.on('fileDone',   process_next_file);
    dirEE.on('allDone',    process_end);

    start();

    function start() {
        dirEE.emit('start');
    }

    function open_dir() {
        fs.readdir(data_dir, function(err, fls) {
            if (err) throw err;
            files = fls.filter((v)=>{return /.*\.dat/.test(v)});
            dirEE.emit('filesReady');
            log('files: ', files)
        });
    }

    function process_next_file() {
        if(files.length == 0) {
            dirEE.emit('allDone');
            return;
        }

        log('files: ', files)
        var file = files.shift();
        log('processing ', file)

        process_one_file(file, dirEE);
    }
}

function process_one_file(file, dir_ee) {
    const data_info = {};
    const data_file = data_dir + file;

    var found = file.match(/(.*)\.dat/);

    data_info.table_name = found[1];

    console.log('Processing file: ' + data_file);

    data_info.cnt = -1;
    data_info.batch_cnt = 0;
    data_info.affected_rows = 0;
    data_info.data_file = data_file;
    data_info.dd = [];
    data_info.load_count = 0;
    data_info.encoding = 'ascii';
    data_info.buffer_size = 1024 * 1024;  
    data_info.total_bytes = 0;
    data_info.data_buffer = new Buffer(data_info.buffer_size, data_info.encoding);
    data_info.to_be_end = 0;
    data_info.line_buffer = '';
    data_info.data_lines = null;
    data_info.truncate_flag = 1;

    const oneFileEE = new MyEmitter();
    /*  Events List
        fileOpened:
        dataReady:
        dataEnd:
        tableTruncated:
        dataLoaded:
    */

    oneFileEE.on('fileOpened', read_data_block);
    oneFileEE.on('dataReady',  load_data);
    oneFileEE.on('dataLoaded', read_data_block);
    oneFileEE.on('dataEnd',    ()=>{dir_ee.emit('fileDone')});
    
    function start() {
        truncate_table();
        open_data_file();
    }
    
    function open_data_file() {
        function openDataFileCB(err, fd) {
            if(err) throw err;
            data_info.fd = fd;
            oneFileEE.emit('fileOpened');
        }
        fs.open(data_info.data_file, 'r' , openDataFileCB);
    }

    function parse_datablock() {
        data_info.total_bytes += data_info.current_bytes;
        const s = data_info.data_buffer.toString(data_info.encoding, 0, 
                        data_info.current_bytes + data_info.line_buffer.length);
        var lines = s.split(/\r?\n/);
        data_info.line_buffer = lines.pop();
        data_info.data_lines = lines;
    }

    function read_data_block() {
        if( data_info.to_be_end == 1) {
            fs.close(data_info.fd);
            data_info.data_lines = null;
            oneFileEE.emit('dataEnd');
            return
        }
        const offset = data_info.line_buffer.length;
        const length = data_info.buffer_size - offset;
        data_info.data_buffer.fill(data_info.line_buffer, 0, offset); 

        function readDataBlockCB(err, bytes) {
            if(err) throw err;
            data_info.current_bytes = bytes;
            if(bytes < data_info.buffer_size - data_info.line_buffer.length ) {
                data_info.to_be_end = 1;
            }
            parse_datablock();
            oneFileEE.emit('dataReady');
        } 
        fs.read(data_info.fd, data_info.data_buffer, offset, length, null, readDataBlockCB);
    }

    function process_lines() {
        data_info.dd = [];
        data_info.data_lines.forEach((line)=>{
            if(blank.test(line)) return;
            data_info.cnt++;
            if(data_info.cnt == 0) {
                data_info.line_first = line;
                make_sql();
                return;
            }
            if(/rows selected/.test(line)) {
                data_info.line_last = line;
                data_info.cnt--;
                return; 
            }
            var res = cvs.parse(line, ',');
            var ds = res[0].map( (e) => {
                if(e == '') 
                    return null 
                else return e}) ;
            data_info.dd.push(ds);
        });
        data_info.data_lines = null;
    }

    function truncate_table() {
        if( data_info.truncate_flag == 0) {
            oneFileEE.emit('tableTruncated');
            return
        }
        connection.query('truncate table ' + data_info.table_name,
          function (err) {
            if (err) {
                console.log('error: truncate table ' + data_info.table_name);    
                throw err;
            }
            oneFileEE.emit('tableTruncated');
        });
    }

    function make_sql() {
        var sql = 'insert into ' + data_info.table_name + ' ( ';
        var flds = cvs.parse(data_info.line_first, ',');
            sql += flds.join(',') + ') values ?';
            console.log('sql', sql);
        data_info.sql_insert = sql;
    }

    function load_data() {
        data_info.load_count += 1;
        process_lines();
        if(data_info.dd.length === 0 ) {
            console.log('no data to load');
            oneFileEE.emit('dataLoaded');
            return;
        }
        var dds = [data_info.dd];
        connection.query(data_info.sql_insert, dds,
            function sql_query_cb(err, res){
                if (err) {
                     console.log('err ' + data_info.sql_insert);    
                     //data_info.dd = null;
                     console.log(util.inspect(data_info));
                     console.log(util.inspect(err));
                     throw err;
                }
                dds = null;
                data_info.affected_rows += res.affectedRows;
//                ()=>{console.log('rows affected:', data_info.affected_rows, res.affectedRows)}();
                var total_affected_rows = data_info.affected_rows;
                var affected_rows = res.affected_rows;
                ()=>{console.log('rows affected:', total_affected_rows, affectedRows)}();
                oneFileEE.emit('dataLoaded');
            } 
        );
    }

    start();
}
