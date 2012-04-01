#!/usr/bin/env node
//TODO: add option to filter whitespace

var 
    util = require('util'),
    xml = require("node-xml"),
    Stack = require('./stack'),
    assert = require('assert');

function constructAttrObj(nodeXmlAttrList){
    var o = {};
    //list of pairs
    nodeXmlAttrList.forEach(function(pair){
        o[pair[0]] = pair[1];
    });

    return o;
}

function getParser(doneCb){

    var root,tupleStack;

    function appendText(chars){
        //console.log('chars',chars);

        //we may encounter text nodes before the root element, so we just skip them.
        //we may also have reached the end, and have some trailing whitespace, in which case tupleStack will be empty.
        if(tupleStack && tupleStack.length){ 
            var currentTuple = tupleStack.peek();
            //we may read chars in chunks, so make sure we combine them when needed
            if( currentTuple.length > 1 && typeof currentTuple[currentTuple.length - 1] === 'string'){
                currentTuple[currentTuple.length - 1] += chars;
            }else{
                currentTuple.push(chars);
            }
        }
    }

    return new xml.SaxParser(function(cb) {

        cb.onStartDocument(function() {
        });

        cb.onEndDocument(function() {
            doneCb(null,root);
        });

        cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
            //console.log("start",elem, attrs, prefix, uri, namespaces);

            var newTuple = [];

            if(!tupleStack){
                root = newTuple;  //root tuple
                tupleStack = new Stack();   //initialize the stack
            }else{
                tupleStack.peek().push(newTuple);   //otherwise, push him on the previous elements list of tuples
            }

            tupleStack.push(newTuple);   //push the new tuple on the stack

            newTuple.push(elem);    //TODO: deal with prefix, uri, namespaces, etc.

            if(attrs.length){
                newTuple.push(constructAttrObj(attrs));
            }
        });

        cb.onEndElementNS(function(elem, prefix, uri) {
            //console.log("end",elem, prefix, uri);

            var prevTuple = tupleStack.pop();
            try {
                assert.equal(prevTuple[0],elem);
            } catch(e){
                doneCb(e,root);
            }
        });

        cb.onCharacters(appendText);

        cb.onCdata(appendText);

        cb.onComment(function(msg) {
            //skip comments
        });

        cb.onWarning(function(msg) {
            doneCb(new Error(msg),root);
        });

        cb.onError(function(msg) {
            util.log('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
            doneCb(new Error(msg),root);
        });

    });
}

exports.parseString = function(s,done){
    return getParser(done).parseString(s);
};

exports.parseFile = function(fileName,done){
    return getParser(done).parseFile(fileName);
};

if( require.main === module){
    exports.parseFile(process.argv[2],function(err,jsonml){
        if(err){
            console.error(err);
        }else{
            process.stdout.write(JSON.stringify(jsonml,4,4));
        }
    });
}

