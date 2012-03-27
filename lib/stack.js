var StackPrototype = Object.create(
    Array.prototype,
    {"peek" : 
        {
            value : function(){
                return this[this.length - 1];
            }
        }
    }
);

function Stack(){
    this.push.apply(this,(Array.prototype.slice.call(arguments)));
}
Stack.prototype = StackPrototype; 

module.exports = Stack;
