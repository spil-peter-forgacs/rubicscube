/**
 * History storage
 */

var history = (function(){
    
    var history = [];
    
    var pointerCurrent = 0;
    var pointerEnd = 0;
    
    var maxHistory = 1000;
    var cutHistory = 100;
    
    function getLenght() {
        return pointerEnd;
    }
    
    function getCurrent() {
        return pointerCurrent;
    }
    
    function isFirst() {
        return (0 === pointerCurrent);
    }
    
    function isLast() {
        return (pointerCurrent === pointerEnd);
    }
    
    function addElement(element) {
        history[pointerCurrent] = element;
        
        pointerCurrent++;
        // Forget the rest of history, if there was any.
        pointerEnd = pointerCurrent;
        
        // Cut the beginning of history, if it is too much.
        if (pointerEnd > maxHistory) {
            history.slice(cutHistory);
            pointerCurrent -= cutHistory;
            pointerEnd -= cutHistory;
        }
    }
    
    function goBack() {
        if (!isFirst()) {
            pointerCurrent--;
            
            return history[pointerCurrent];
        }
    }
    
    function goForward() {
        if (!isLast()) {
            pointerCurrent++;
            
            return history[pointerCurrent];
        }
    }
    
})();
