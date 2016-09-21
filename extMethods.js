String.prototype.beforeString = function(str, isLastPos) {
    var strPos = -1;
    if(isLastPos)
        strPos = this.lastIndexOf(str);
    else
        strPos = this.indexOf(str);
    if(strPos != -1){
        return this.substr(0,strPos);
    }
    else{
        return "";
    }
};

String.prototype.afterString = function(str, isLastPos) {
    var strPos = -1;
    if(isLastPos)
        strPos = this.lastIndexOf(str);
    else
        strPos = this.indexOf(str);
    if(strPos != -1){
        return this.substr(strPos+1);
    }
    else{
        return null;
    }
};

String.prototype.contains = function(str) {
    return this.indexOf(str) != -1;
};

Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

if (!String.prototype.startsWith) {
    (function() {
        'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
        var defineProperty = (function() {
            // IE 8 only supports `Object.defineProperty` on DOM elements
            try {
                var object = {};
                var $defineProperty = Object.defineProperty;
                var result = $defineProperty(object, object, object) && $defineProperty;
            } catch(error) {}
            return result;
        }());
        var toString = {}.toString;
        var startsWith = function(search) {
            if (this == null) {
                throw TypeError();
            }
            var string = String(this);
            if (search && toString.call(search) == '[object RegExp]') {
                throw TypeError();
            }
            var stringLength = string.length;
            var searchString = String(search);
            var searchLength = searchString.length;
            var position = arguments.length > 1 ? arguments[1] : undefined;
            // `ToInteger`
            var pos = position ? Number(position) : 0;
            if (pos != pos) { // better `isNaN`
                pos = 0;
            }
            var start = Math.min(Math.max(pos, 0), stringLength);
            // Avoid the `indexOf` call if no match is possible
            if (searchLength + start > stringLength) {
                return false;
            }
            var index = -1;
            while (++index < searchLength) {
                if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
                    return false;
                }
            }
            return true;
        };
        if (defineProperty) {
            defineProperty(String.prototype, 'startsWith', {
                'value': startsWith,
                'configurable': true,
                'writable': true
            });
        } else {
            String.prototype.startsWith = startsWith;
        }
    }());
}