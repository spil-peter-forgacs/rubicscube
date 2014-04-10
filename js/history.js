/**
 * History storage
 */

var history = (function(){
    
    var history = [];
    
    var pointerCurrent = 0;
    var pointerEnd = 0;
    
    var maxHistory = 1000;
    var cutHistory = 100;
    
    var isLocalStorage = true;
    
    
    function getLenght() {
        return pointerEnd;
    }
    
    function getCurrent() {
        return pointerCurrent;
    }
    
    function getHistory() {
        return history;
    }
    
    function isFirst() {
        return (0 === pointerCurrent);
    }
    
    function isLast() {
        return (pointerCurrent === pointerEnd);
    }
    
    function saveHistory() {
        if (isLocalStorage) {
            localStorage.setItem('rubikHistory', history);
        }
    }
    
    function savePointers() {
        if (isLocalStorage) {
            localStorage.setItem('rubikPointerCurrent', history);
            localStorage.setItem('rubikPointerEnd', history);
        }
    }
    
    function empty() {
        history = [];
        pointerCurrent = 0;
        pointerEnd = 0;
        
        saveHistory();
        savePointers();
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
        
        saveHistory();
        savePointers();
    }
    
    function goBack() {
        if (!isFirst()) {
            pointerCurrent--;
            savePointers();
            
            return history[pointerCurrent];
        }
    }
    
    function goForward() {
        if (!isLast()) {
            pointerCurrent++;
            savePointers();
            
            return history[pointerCurrent];
        }
    }
    
    
    // Set history and pointers from earlier data.
    if (isLocalStorage) {
        var rubikHistory = localStorage.getItem('rubikHistory');
        if (rubikHistory) {
            history = rubikHistory;
        }
        var pC = localStorage.getItem('rubikPointerCurrent');
        if (pC) {
            pointerCurrent = pC;
        }
        var pE = localStorage.getItem('rubikPointerEnd');
        if (pE) {
            pointerEnd = pE;
        }
    }
    
    return {
        getLenght: getLenght,
        getCurrent: getCurrent,
        getHistory: getHistory,
        isFirst: isFirst,
        isLast: isLast,
        empty: empty,
        addElement: addElement,
        goBack: goBack,
        goForward: goForward,
    }
})();
