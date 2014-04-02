var MOUSE_STATE_NULL = 0;
var MOUSE_STATE_AXIS_X = 10;
var MOUSE_STATE_AXIS_Y = 11;
var MOUSE_STATE_AXIS_Z = 12;
var MOUSE_STATE_CLICK = 20;
var MOUSE_STATE_CLICK_CAPTURED = 21;
var MOUSE_STATE_RELEASED = 22;
var mouseState = MOUSE_STATE_NULL;

var targetRotationX = 0;
var targetRotationXOnMouseDown = 0;
var targetRotationY = 0;
var targetRotationYOnMouseDown = 0;
var targetRotationZ = 0;
var targetRotationZOnMouseDown = 0;

var mouseX = 0;
var mouseY = 0;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;
var mouseXDelta = 0;
var mouseYDelta = 0;

var mouseUp = true;

var piHalf = (Math.PI / 2);

var projector = new THREE.Projector();
var clickedObjects;

document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'touchstart', onDocumentTouchStart, false );
document.addEventListener( 'touchmove', onDocumentTouchMove, false );
document.addEventListener( 'touchend', onDocumentTouchEnd, false );

function onDocumentMouseDown( event ) {
    event.preventDefault();
    
    mouseUp = false;
    
    if (MOUSE_STATE_RELEASED == mouseState) {
    	mouseState = MOUSE_STATE_NULL;
    }
    
    var intersects = getClickTargetObjects(event.clientX, event.clientY);
    
    if ( intersects.length > 1 ) {
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
    
    mouseXOnMouseDown = event.clientX - windowHalfX;
    mouseYOnMouseDown = event.clientY - windowHalfY;
    
    targetRotationXOnMouseDown = targetRotationX;
    targetRotationYOnMouseDown = targetRotationY;
    targetRotationZOnMouseDown = targetRotationZ;
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseMove( event ) {
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
                console.warn('x', clickedObjects[ 1 ].object.position, clickedObjects[ 0 ].object.position, intersects[ 0 ].object.position);
                
                mouseState = MOUSE_STATE_CLICK_CAPTURED;
                
                var point = clickedObjects[ 0 ].point;
                var x1 = clickedObjects[ 0 ].object.position.x;
                var y1 = clickedObjects[ 0 ].object.position.y;
                var z1 = clickedObjects[ 0 ].object.position.z;
                var x2 = intersects[ 0 ].object.position.x;
                var y2 = intersects[ 0 ].object.position.y;
                var z2 = intersects[ 0 ].object.position.z;
                rotatePage(point, x1, y1, z1, x2, y2, z2);
            }
        }
    }
    else if (MOUSE_STATE_CLICK_CAPTURED == mouseState || MOUSE_STATE_RELEASED == mouseState) {
        // Do nothing.
    }
    else {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        
        mouseXDelta = mouseX - mouseXOnMouseDown;
        mouseYDelta = mouseY - mouseYOnMouseDown;
        
        if (MOUSE_STATE_NULL == mouseState && ((Math.abs(mouseXDelta) > 10 || Math.abs(mouseYDelta) > 10))) {
            if (Math.abs(mouseXDelta) > Math.abs(mouseYDelta)) {
                mouseState = MOUSE_STATE_AXIS_Y;
            }
            else {
                mouseState = (mouseX < 0 ? MOUSE_STATE_AXIS_Z : MOUSE_STATE_AXIS_X);
            }
        }
        
        if (MOUSE_STATE_AXIS_X == mouseState) {
            targetRotationX = targetRotationXOnMouseDown + mouseYDelta * 0.02;
            fixTargetRotationX();
        }
        else if (MOUSE_STATE_AXIS_Y == mouseState) {
            targetRotationY = targetRotationYOnMouseDown + mouseXDelta * 0.008;
            fixTargetRotationY();
        }
        else if (MOUSE_STATE_AXIS_Z == mouseState) {
            targetRotationZ = targetRotationZOnMouseDown + mouseYDelta * 0.02;
            fixTargetRotationZ();
        }
    }
}

function onDocumentMouseUp( event ) {
    mouseUp = true;
    
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    //mouseUp = true;
    
    //document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    //document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        
        mouseUp = false;
        
        var intersects = getClickTargetObjects(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
        
        if ( intersects.length > 1 ) {
            mouseState = MOUSE_STATE_CLICK;
            
            //intersects[ 0 ].object.position = {x: 5, y: 0, z: 0};
        }
        
        mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
        mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
        
        targetRotationXOnMouseDown = targetRotationX;
        targetRotationYOnMouseDown = targetRotationY;
        targetRotationZOnMouseDown = targetRotationZ;
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        
        if (MOUSE_STATE_CLICK == mouseState) {
            // TODO
        }
        else {
            mouseX = event.touches[ 0 ].pageX - windowHalfX;
            mouseY = event.touches[ 0 ].pageY - windowHalfY;
            
            mouseXDelta = mouseX - mouseXOnMouseDown;
            mouseYDelta = mouseY - mouseYOnMouseDown;
            
            if (MOUSE_STATE_NULL == mouseState && ((Math.abs(mouseXDelta) > 10 || Math.abs(mouseYDelta) > 10))) {
                if (Math.abs(mouseXDelta) > Math.abs(mouseYDelta)) {
                    mouseState = MOUSE_STATE_AXIS_Y;
                }
                else {
                    mouseState = (mouseX < 0 ? MOUSE_STATE_AXIS_Z : MOUSE_STATE_AXIS_X);
                }
            }
            
            if (MOUSE_STATE_AXIS_X == mouseState) {
                targetRotationX = targetRotationXOnMouseDown + mouseYDelta * 0.015;
                fixTargetRotationX();
            }
            else if (MOUSE_STATE_AXIS_Y == mouseState) {
                targetRotationY = targetRotationYOnMouseDown + mouseXDelta * 0.008;
                fixTargetRotationY();
            }
            else if (MOUSE_STATE_AXIS_Z == mouseState) {
                targetRotationZ = targetRotationZOnMouseDown + mouseYDelta * 0.015;
                fixTargetRotationZ();
            }
        }
    }
}

function onDocumentTouchEnd( event ) {
    event.preventDefault();
        
    mouseUp = true;
}

function fixTargetRotationX() {
    targetRotationX = Math.floor(targetRotationX / piHalf) * piHalf;
}
function fixTargetRotationY() {
    targetRotationY = Math.floor(targetRotationY / piHalf) * piHalf + (Math.PI / 4);
}
function fixTargetRotationZ() {
    targetRotationZ = Math.floor(targetRotationZ / piHalf) * piHalf;
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
