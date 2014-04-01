var MOUSE_STATE_NULL = 0;
var MOUSE_STATE_AXIS_X = 10;
var MOUSE_STATE_AXIS_Y = 11;
var MOUSE_STATE_AXIS_Z = 12;
var MOUSE_STATE_CLICK = 20;
var mouseState = MOUSE_STATE_NULL;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseY = 0;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;

var projector = new THREE.Projector();

document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'touchstart', onDocumentTouchStart, false );
document.addEventListener( 'touchmove', onDocumentTouchMove, false );

function onDocumentMouseDown( event ) {
    event.preventDefault();
    
    var intersects = getClickTargetObjects(event.clientX, event.clientY);
    
    if ( intersects.length > 0 ) {
        mouseState = MOUSE_STATE_CLICK;
        
        //intersects[ 0 ].object.position = {x: 5, y: 0, z: 0};
        //intersects[ 0 ].object.rotation.y = Math.PI / 2;
        //console.warn('x', intersects, intersects[ 0 ].object, event.clientX, event.clientY, intersects[ 0 ].object.position);
        //console.warn('x', intersects[ 0 ].object.position, event.clientX, event.clientY);
    }
    else {
        mouseState = MOUSE_STATE_NULL;
        
        mouseXOnMouseDown = event.clientX - windowHalfX;
        mouseYOnMouseDown = event.clientY - windowHalfY;
        targetRotationOnMouseDown = targetRotation;
    }
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseMove( event ) {
    if (MOUSE_STATE_CLICK == mouseState) {
    }
    else {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        
        mouseXDelta = mouseX - mouseXOnMouseDown;
        mouseYDelta = mouseY - mouseYOnMouseDown;
        
        if (MOUSE_STATE_NULL == mouseState) {
            if (Math.abs(mouseXDelta) > Math.abs(mouseYDelta)) {
                mouseState = MOUSE_STATE_AXIS_Y;
            }
            else {
                mouseState = (mouseX < 0 ? MOUSE_STATE_AXIS_Z : MOUSE_STATE_AXIS_X);
            }
        }
        
        if (MOUSE_STATE_AXIS_Y == mouseState) {
            targetRotation = targetRotationOnMouseDown + mouseXDelta * 0.008;
            fixTargetRotation();
        }
        else {
            targetRotation = targetRotationOnMouseDown + mouseYDelta * 0.008;
        }
        
        //console.warn('xx', mouseState, mouseX, mouseY);
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
        
        var intersects = getClickTargetObjects(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
        
        if ( intersects.length > 0 ) {
            mouseState = MOUSE_STATE_CLICK;
            
            //intersects[ 0 ].object.position = {x: 5, y: 0, z: 0};
        }
        else {
            mouseState = MOUSE_STATE_NULL;
            
            mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
            mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
            targetRotationOnMouseDown = targetRotation;
        }
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfX;
        targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.01;
        
        fixTargetRotation();
    }
}

function fixTargetRotation() {
    var piHalf = (Math.PI / 2);
    targetRotation = Math.floor(targetRotation / piHalf) * piHalf + (Math.PI / 4);
}

function getClickTargetObjects(eventX, eventY) {
    var vector = new THREE.Vector3( ( eventX / window.innerWidth ) * 2 - 1, - ( eventY / window.innerHeight ) * 2 + 1, 0.5 );
    projector.unprojectVector( vector, camera );
    
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    
    var intersects = raycaster.intersectObjects( rubicsCube.children );
    
    return intersects;
}
