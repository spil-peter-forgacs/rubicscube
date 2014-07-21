/**
 * History storage
 * 
 * @author Peter Forgacs
 * @version 1.0
 * @created 31-March-2014 - 11-April-2014
 */

var myHistory = (function(){
    // History container.
    var history = [];
    
    // Pointers.
    var pointerCurrent = 0;
    var pointerEnd = 0;
    
    // Safety elements.
    var maxHistory = 1000;
    var cutHistory = 100;
    
    // Store in local storage?
    var isLocalStorage = false;
    
    /**
     * Gives back the length of history.
     * 
     * @return Integer pointerEnd
     */
    function getLenght() {
        return pointerEnd;
    }
    
    /**
     * Get the number of current item.
     * 
     * @return Integer pointerCurrent
     */
    function getCurrent() {
        return pointerCurrent;
    }
    
    /**
     * Gets all the history.
     * 
     * @return Array history
     */
    function getHistory() {
        return history;
    }
    
    /**
     * Is current the first element?
     * 
     * @return Boolean
     */
    function isFirst() {
        return (0 === pointerCurrent);
    }
    
    /**
     * Is current the last element?
     * 
     * @return Boolean
     */
    function isLast() {
        return (pointerCurrent === pointerEnd);
    }
    
    /**
     * Save history in local storage.
     */
    function saveHistory() {
        if (isLocalStorage) {
            localStorage.setItem('rubikHistory', history);
        }
    }
    
    /**
     * Save pointers in local storage.
     */
    function savePointers() {
        if (isLocalStorage) {
            localStorage.setItem('rubikPointerCurrent', history);
            localStorage.setItem('rubikPointerEnd', history);
        }
    }
    
    /**
     * Makes history empty.
     */
    function empty() {
        history = [];
        pointerCurrent = 0;
        pointerEnd = 0;
        
        saveHistory();
        savePointers();
    }
    
    /**
     * Add an element to the current pointer.
     * Also clears the rest.
     * 
     * @param Mixed element
     */
    function addElement(element) {
        history[pointerCurrent] = element;
        
        pointerCurrent++;
        // Forget the rest of history, if there was any.
        pointerEnd = pointerCurrent;
        
        // Cut the beginning of history, if it is too much.
        if (pointerEnd > maxHistory) {
            history = history.slice(cutHistory);
            pointerCurrent -= cutHistory;
            pointerEnd -= cutHistory;
        }
        
        saveHistory();
        savePointers();
    }
    
    /**
     * Go back one step.
     * 
     * @return Mixed element
     *   Current element
     */
    function goBack() {
        if (!isFirst()) {
            pointerCurrent--;
            savePointers();
            
            var element = history[pointerCurrent];
            
            return element;
        }
    }
    
    /**
     * Go forward one step.
     * 
     * @return Mixed element
     *   Current element
     */
    function goForward() {
        if (!isLast()) {
            var element = history[pointerCurrent];
            
            pointerCurrent++;
            savePointers();
            
            return element;
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
