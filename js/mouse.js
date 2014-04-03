var MOUSE_STATE_NULL = 0;
var MOUSE_STATE_AXIS = 10;
var MOUSE_STATE_CLICK = 20;
var MOUSE_STATE_CLICK_CAPTURED = 21;
var MOUSE_STATE_CLICK_RELEASED = 22;
var mouseState = MOUSE_STATE_NULL;

var mouseX = 0;
var mouseY = 0;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;
var mouseXDelta = 0;
var mouseYDelta = 0;

var projector = new THREE.Projector();
var clickedObjects;

document.addEventListener( 'mousedown', onDocumentMouseDown, false );

document.addEventListener( 'touchstart', onDocumentTouchStart, false );
document.addEventListener( 'touchmove', onDocumentTouchMove, false );
document.addEventListener( 'touchend', onDocumentTouchEnd, false );

function onDocumentMouseDown( event ) {
    event.preventDefault();
    
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    clickWithMouse(mouseX, mouseY);
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );
}

function clickWithMouse(mouseX, mouseY) {
    if (MOUSE_STATE_CLICK_RELEASED == mouseState) {
        mouseState = MOUSE_STATE_NULL;
    }
    
    var intersects = getClickTargetObjects(mouseX, mouseY);
    
    if ( intersects.length > 0 ) {
        var found = -1;
        for (var i = 0; i < cubePage.length; i++) {
            if (cubePage[i].id == intersects[ 0 ].object.id) {
                found = i;
            }
        }
        if (found >= 0) {
            mouseState = MOUSE_STATE_CLICK;
            
            clickedObjects = intersects;
        }
    }
    else {
        mouseState = MOUSE_STATE_AXIS;
    }
    
    mouseXOnMouseDown = mouseX - windowHalfX;
    mouseYOnMouseDown = mouseY - windowHalfY;
}

function onDocumentMouseMove( event ) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    moveWithMouse(mouseX, mouseY);
}

function moveWithMouse(mouseX, mouseY) {
    mouseX = mouseX - windowHalfX;
    mouseY = mouseY - windowHalfY;
    
    if (MOUSE_STATE_CLICK == mouseState) {
        var intersects = getClickTargetObjects(event.clientX, event.clientY);
        if ( intersects.length > 0 && clickedObjects[ 0 ].object != intersects[ 0 ].object) {
            var found = -1;
            for (var i = 0; i < cubePage.length; i++) {
                if (cubePage[i].id == intersects[ 0 ].object.id) {
                    found = i;
                }
            }
            if (found >= 0) {
                mouseState = MOUSE_STATE_CLICK_CAPTURED;
                
                var point = clickedObjects[ 0 ].point;
                var x1 = clickedObjects[ 0 ].object.position.x;
                var y1 = clickedObjects[ 0 ].object.position.y;
                var z1 = clickedObjects[ 0 ].object.position.z;
                var x2 = intersects[ 0 ].object.position.x;
                var y2 = intersects[ 0 ].object.position.y;
                var z2 = intersects[ 0 ].object.position.z;
                
                
                // Calculating the correct page.
                var windowHalfXY = (windowHalfX < windowHalfY ? windowHalfX : windowHalfY);
                var pointX = mouseX / windowHalfXY;
                var pointY = mouseY / windowHalfXY;
                var x = 1 * (Math.floor(Math.abs(pointX) / 0.2) - 1);
                var y = -1 * (Math.floor(Math.abs(pointY) / 0.2) - 1);
                var z = -1 * (Math.floor(Math.abs(pointX) / 0.2) - 1);
console.warn(pointX, pointY);
                
                rotatePage(x, y, z, x1 == x2, y1 == y2, z1 == z2, y1 > y2, z1 < z2, y1 > y2);
            }
        }
    }
    else if (MOUSE_STATE_AXIS == mouseState) {
        mouseXDelta = mouseX - mouseXOnMouseDown;
        mouseYDelta = mouseY - mouseYOnMouseDown;
        
        var axis = '';
        if ((Math.abs(mouseXDelta) > 10 || Math.abs(mouseYDelta) > 10)) {
            if (Math.abs(mouseXDelta) > Math.abs(mouseYDelta)) {
                axis = 'y';
            }
            else {
                axis = (mouseX < 0 ? 'z' : 'x');
            }
            
            var x = y = z = 0;
            var xStatic = yStatic = zStatic = false;
            var xDirection = yDirection = zDirection = null;
            if ('x' == axis) {
                xStatic = true;
                xDirection = (mouseYDelta >= 0);
                for (var x = -1; x <= 1; x++) {
                    rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection);
                }
            }
            else if ('y' == axis) {
                yStatic = true;
                yDirection = (mouseXDelta >= 0);
                for (var y = -1; y <= 1; y++) {
                    rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection);
                }
            }
            else if ('z' == axis) {
                zStatic = true;
                zDirection = (mouseYDelta >= 0);
                for (var z = -1; z <= 1; z++) {
                    rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection);
                }
            }
            
            mouseState = MOUSE_STATE_NULL;
        }
    }
}

function onDocumentMouseUp( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        
        mouseX = event.touches[ 0 ].pageX;
        mouseY = event.touches[ 0 ].pageY;
        
        clickWithMouse(mouseX, mouseY);
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        
        mouseX = event.touches[ 0 ].pageX;
        mouseY = event.touches[ 0 ].pageY;
        
        moveWithMouse(mouseX, mouseY);
    }
}

function onDocumentTouchEnd( event ) {
    event.preventDefault();
}

function getClickTargetObjects(eventX, eventY) {
    var vector = new THREE.Vector3( ( eventX / window.innerWidth ) * 2 - 1, - ( eventY / window.innerHeight ) * 2 + 1, 0.5 );
    projector.unprojectVector( vector, camera );
    
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    
    var children = [];
    for (var i = 0; i < rubicsCube.children.length; i++) {
        if (rubicsCube.children[i].children.length > 0) {
            children.push(rubicsCube.children[i].children[0]);
        }
        else {
            children.push(rubicsCube.children[i]);
        }
    }
    
    var intersects = raycaster.intersectObjects( children );
    
    return intersects;
}
