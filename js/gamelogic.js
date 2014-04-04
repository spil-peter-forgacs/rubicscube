var game = (function(){
    
    // Basic variables for 3d.
    var scene, camera, renderer;

    // Whole cube.
    var rubicsCube;
    // Container of small cubes.
    var rubicsPage = [];
    // Small cubes.
    var cubeMesh = [];
    // Pages around the cube.
    // Used for capturing the movements.
    var cubePage = [];

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    
    function booting() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        
        window.addEventListener('resize', onWindowResize, false);
        
        initializeScene();
        animateScene();
    }
    
    function initializeScene() {
        //
        // Basic staff.
        //
        
        // Setup renderer.
        if(Detector.webgl) {
            renderer = new THREE.WebGLRenderer({antialias:true});
        }
        else {
            renderer = new THREE.CanvasRenderer();
        }
        
        // Set the background color of the renderer to black, with full opacity.
        renderer.setClearColor(0x000000, 1);
        
        // Get the size of the inner window (content area) to create a full size renderer.
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        
        // Set the renderers size to the content areas size.
        renderer.setSize(canvasWidth, canvasHeight);
        
        // Append the renderers DOM.
        document.body.style.margin = 0;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(renderer.domElement);
        
        
        // Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...).
        scene = new THREE.Scene();
        
        var aspect = canvasWidth / canvasHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 1, 100);
        camera.position.set(0, 0, 10);
        scene.add(camera);
        
        //
        // Rubic's cube.
        //
        
        // The Rubic's cube.
        rubicsCube = new THREE.Object3D();
        scene.add(rubicsCube);
        
        // Rotation
        rubicsCube.rotation.y = Math.PI / 4;
        rubicsCube.rotation.x = Math.PI / 4;
        
        // Pages.
        var shape = new THREE.PlaneGeometry(3, 3);
        var materials = [
            new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.0 } )
        ];
        var cover = new THREE.MeshFaceMaterial( materials );
        var i = 0;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].position.set(0, 0, 1.6);
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.x = Math.PI;
        cubePage[i].position.set(0, 0, -1.6);
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.x = -Math.PI / 2;
        cubePage[i].position.set(0, 1.6, 0);
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.x = Math.PI / 2;
        cubePage[i].position.set(0, -1.6, 0);
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.y = Math.PI / 2;
        cubePage[i].position.set(1.6, 0, 0);
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.y = -Math.PI / 2;
        cubePage[i].position.set(-1.6, 0, 0);
        
        // Create the cube.
        // When the CanvasRenderer is used, the texture has some distortions.
        // To get rid of this, you only have to increase the number of cube segments.
        // The WebGLRenderer doesn't needs this workaround.
        // Original: var cubeGeometry = new THREE.CubeGeometry(2.0, 2.0, 2.0);
        var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0, 4, 4, 4);
        // Load images as textures.
        var cubeTexture = [
            new THREE.ImageUtils.loadTexture("pics/green.jpg"),
            new THREE.ImageUtils.loadTexture("pics/blue.jpg"),
            new THREE.ImageUtils.loadTexture("pics/yellow.jpg"),
            new THREE.ImageUtils.loadTexture("pics/white.jpg"),
            new THREE.ImageUtils.loadTexture("pics/red.jpg"),
            new THREE.ImageUtils.loadTexture("pics/orange.jpg"),
            new THREE.ImageUtils.loadTexture("pics/black.jpg"),
        ];
        
        // Cube colors: yellow, blue, red, green, orange, white
        // Color order:
        //  y   (Top)
        // brgo (Side)
        //  w   (Bottom)
        
        for (var i = -1; i <= 1; i++) {
            cubeMesh[i] = [];
            rubicsPage[i] = [];
            for (var j = -1; j <= 1; j++) {
                cubeMesh[i][j] = [];
                rubicsPage[i][j] = [];
                for (var k = -1; k <= 1; k++) {
                    // Define six texture materials.
                    var cubeMaterials = [
                        new THREE.MeshBasicMaterial({map:cubeTexture[0]}),
                        new THREE.MeshBasicMaterial({map:cubeTexture[1]}),
                        new THREE.MeshBasicMaterial({map:cubeTexture[2]}),
                        new THREE.MeshBasicMaterial({map:cubeTexture[3]}),
                        new THREE.MeshBasicMaterial({map:cubeTexture[4]}),
                        new THREE.MeshBasicMaterial({map:cubeTexture[5]}),
                    ];
                    // Make the non visible sides black.
                    /*
                    if (1 != i) {
                        cubeMaterials[0] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    if (-1 != i) {
                        cubeMaterials[1] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    if (1 != j) {
                        cubeMaterials[2] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    if (-1 != j) {
                        cubeMaterials[3] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    if (1 != k) {
                        cubeMaterials[4] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    if (-1 != k) {
                        cubeMaterials[5] = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                     */
                    
                    // Create a MeshFaceMaterial, which allows the cube to have different materials on each face.
                    var cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
                    cubeMesh[i][j][k] = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    cubeMesh[i][j][k].position.set(i, j, k);
                    
                    // Containers.
                    rubicsPage[i][j][k] = new THREE.Object3D();
                    rubicsCube.add(rubicsPage[i][j][k]);
                    // Name it for debugging reason.
                    rubicsPage[i][j][k].name = i + ',' + j + ',' + k;
                    
                    // Add the small cubes to their container.
                    rubicsPage[i][j][k].add(cubeMesh[i][j][k]);
                }
            }
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    /**
     * Rotate an object around an arbitrary axis in object space
     */
    function rotateAroundObjectAxis(object, axis, radians) {
        var rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

        // post-multiply
        object.matrix.multiply(rotObjectMatrix);

        object.rotation.setFromRotationMatrix(object.matrix);
    }

    /**
     * Rotate an object around an arbitrary axis in world space
     */
    function rotateAroundWorldAxis(object, axis, radians) {
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

        // pre-multiply
        rotWorldMatrix.multiply(object.matrix);
        object.matrix = rotWorldMatrix;

        object.rotation.setFromRotationMatrix(object.matrix);
    }

    /**
     * Rotate a single page.
     */
    function rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection) {
        var xAxisLocal = new THREE.Vector3(1, 0, 0);
        var yAxisLocal = new THREE.Vector3(0, 1, 0);
        var zAxisLocal = new THREE.Vector3(0, 0, 1);
        
        var rotAngle;
        var axisLocal;
        if (xStatic) {
            axisLocal = xAxisLocal;
            rotAngle = (Math.PI / 2) * (xDirection ? 1 : -1);
        }
        else if (yStatic) {
            axisLocal = yAxisLocal;
            rotAngle = (Math.PI / 2) * (yDirection ? 1 : -1);
        }
        else if (zStatic) {
            axisLocal = zAxisLocal;
            rotAngle = (Math.PI / 2) * (zDirection ? 1 : -1);
        }
        else {
            console.warn('Exception');
        }
        
        var rotAngleDiff = 0;
        var rotAndleDelta = rotAngle / 8;
        moveCubes();
        function moveCubes() {
            if (Math.abs(rotAngleDiff) < Math.abs(rotAngle)) {
                rotAngleDiff += rotAndleDelta;
                
                // Moving visible.
                var p = [];
                var pi = 0;
                for (p[0] = -1; p[0] <= 1; p[0]++) {
                    for (p[1] = -1; p[1] <= 1; p[1]++) {
                        pi = 0;
                        var xi = (xStatic ? x : p[pi++]);
                        var yi = (yStatic ? y : p[pi++]);
                        var zi = (zStatic ? z : p[pi++]);
                        rotateAroundWorldAxis(rubicsPage[xi][yi][zi], axisLocal, rotAndleDelta);
                    }
                }
                setTimeout(function () {moveCubes()}, 20);
            }
            else {
                // Moving virtual containers.
                if (xStatic) {
                    movePageX(-rotAngle, x);
                }
                else if (yStatic) {
                    movePageY(rotAngle, y);
                }
                else if (zStatic) {
                    movePageZ(-rotAngle, z);
                }
                
                mouseState = MOUSE_STATE_CLICK_RELEASED;
            }
        }
    }

    /**
     * Logging, debugging.
     */
    function logCube() {
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    console.warn('logcube', i, j, k, rubicsPage[i][j][k].name);
                }
            }
        }
        console.warn('-----------');
    }

    function moveMiddleX(direction, i) {
        var tmp = rubicsPage[i][0][1];
        if (direction > 0) {
            rubicsPage[i][0][1] = rubicsPage[i][-1][0];
            rubicsPage[i][-1][0] = rubicsPage[i][0][-1];
            rubicsPage[i][0][-1] = rubicsPage[i][1][0];
            rubicsPage[i][1][0] = tmp;
        }
        else {
            rubicsPage[i][0][1] = rubicsPage[i][1][0];
            rubicsPage[i][1][0] = rubicsPage[i][0][-1];
            rubicsPage[i][0][-1] = rubicsPage[i][-1][0];
            rubicsPage[i][-1][0] = tmp;
        }
    }

    function moveMiddleY(direction, i) {
        var tmp = rubicsPage[0][i][1];
        if (direction > 0) {
            rubicsPage[0][i][1] = rubicsPage[-1][i][0];
            rubicsPage[-1][i][0] = rubicsPage[0][i][-1];
            rubicsPage[0][i][-1] = rubicsPage[1][i][0];
            rubicsPage[1][i][0] = tmp;
        }
        else {
            rubicsPage[0][i][1] = rubicsPage[1][i][0];
            rubicsPage[1][i][0] = rubicsPage[0][i][-1];
            rubicsPage[0][i][-1] = rubicsPage[-1][i][0];
            rubicsPage[-1][i][0] = tmp;
        }
    }

    function moveMiddleZ(direction, i) {
        var tmp = rubicsPage[0][1][i];
        if (direction > 0) {
            rubicsPage[0][1][i] = rubicsPage[-1][0][i];
            rubicsPage[-1][0][i] = rubicsPage[0][-1][i];
            rubicsPage[0][-1][i] = rubicsPage[1][0][i];
            rubicsPage[1][0][i] = tmp;
        }
        else {
            rubicsPage[0][1][i] = rubicsPage[1][0][i];
            rubicsPage[1][0][i] = rubicsPage[0][-1][i];
            rubicsPage[0][-1][i] = rubicsPage[-1][0][i];
            rubicsPage[-1][0][i] = tmp;
        }
    }

    function moveCornerX(direction, i) {
        var tmp = rubicsPage[i][1][1];
        if (direction > 0) {
            rubicsPage[i][1][1] = rubicsPage[i][-1][1];
            rubicsPage[i][-1][1] = rubicsPage[i][-1][-1];
            rubicsPage[i][-1][-1] = rubicsPage[i][1][-1];
            rubicsPage[i][1][-1] = tmp;
        }
        else {
            rubicsPage[i][1][1] = rubicsPage[i][1][-1];
            rubicsPage[i][1][-1] = rubicsPage[i][-1][-1];
            rubicsPage[i][-1][-1] = rubicsPage[i][-1][1];
            rubicsPage[i][-1][1] = tmp;
        }
    }

    function moveCornerY(direction, i) {
        var tmp = rubicsPage[1][i][1];
        if (direction > 0) {
            rubicsPage[1][i][1] = rubicsPage[-1][i][1];
            rubicsPage[-1][i][1] = rubicsPage[-1][i][-1];
            rubicsPage[-1][i][-1] = rubicsPage[1][i][-1];
            rubicsPage[1][i][-1] = tmp;
        }
        else {
            rubicsPage[1][i][1] = rubicsPage[1][i][-1];
            rubicsPage[1][i][-1] = rubicsPage[-1][i][-1];
            rubicsPage[-1][i][-1] = rubicsPage[-1][i][1];
            rubicsPage[-1][i][1] = tmp;
        }
    }

    function moveCornerZ(direction, i) {
        var tmp = rubicsPage[1][1][i];
        if (direction > 0) {
            rubicsPage[1][1][i] = rubicsPage[-1][1][i];
            rubicsPage[-1][1][i] = rubicsPage[-1][-1][i];
            rubicsPage[-1][-1][i] = rubicsPage[1][-1][i];
            rubicsPage[1][-1][i] = tmp;
        }
        else {
            rubicsPage[1][1][i] = rubicsPage[1][-1][i];
            rubicsPage[1][-1][i] = rubicsPage[-1][-1][i];
            rubicsPage[-1][-1][i] = rubicsPage[-1][1][i];
            rubicsPage[-1][1][i] = tmp;
        }
    }

    function movePageX(direction, i) {
      moveCornerX(direction, i);
      moveMiddleX(direction, i);
    }

    function movePageY(direction, i) {
      moveCornerY(direction, i);
      moveMiddleY(direction, i);
    }

    function movePageZ(direction, i) {
      moveCornerZ(direction, i);
      moveMiddleZ(direction, i);
    }

    function movePageXAll(direction) {
        for (var i = -1; i <= 1; i++) {
            movePageX(direction, i);
        }
    }

    function movePageYAll(direction) {
        for (var i = -1; i <= 1; i++) {
            movePageY(direction, i);
        }
    }

    function movePageZAll(direction) {
        for (var i = -1; i <= 1; i++) {
            movePageZ(direction, i);
        }
    }

    function animateScene() {
        requestAnimationFrame(animateScene);
        
        renderer.render(scene, camera);
    }
    
    var MOUSE_STATE_AXIS = 10;
    var MOUSE_STATE_CLICK = 20;
    var MOUSE_STATE_CLICK_CAPTURED = 21;
    var MOUSE_STATE_CLICK_RELEASED = 22;
    var mouseState = MOUSE_STATE_CLICK_RELEASED;

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
        if (MOUSE_STATE_CLICK_RELEASED != mouseState) {
            return;
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
        if (MOUSE_STATE_CLICK == mouseState) {
            var intersects = getClickTargetObjects(mouseX, mouseY);
            
            // The user navigate away from cube.
            if (intersects.length == 0) {
                mouseState = MOUSE_STATE_CLICK_RELEASED;
                return;
            }
            
            if ( intersects.length > 0 && clickedObjects[ 0 ].object != intersects[ 0 ].object) {
                var found = -1;
                for (var i = 0; i < cubePage.length; i++) {
                    if (cubePage[i].id == intersects[ 0 ].object.id) {
                        found = i;
                    }
                }
                if (found >= 0) {
                    var point = clickedObjects[ 0 ].point;
                    var x1 = clickedObjects[ 0 ].object.position.x;
                    var y1 = clickedObjects[ 0 ].object.position.y;
                    var z1 = clickedObjects[ 0 ].object.position.z;
                    var x2 = intersects[ 0 ].object.position.x;
                    var y2 = intersects[ 0 ].object.position.y;
                    var z2 = intersects[ 0 ].object.position.z;
                    
                    if (clickedObjects.length > 1) {
                        var x, y, z;
                        
                        var foundedCube;
                        for (var q = 0; q < clickedObjects.length; q++) {
                            for (var i = -1; i <= 1; i++) {
                                for (var j = -1; j <= 1; j++) {
                                    if (rubicsPage[i][j][1].children[0] == clickedObjects[ q ].object) {
                                        foundedCube = q;
                                        x = i; y = j; z = 1;
                                    }
                                    else if (rubicsPage[-1][i][j].children[0] == clickedObjects[ q ].object) {
                                        foundedCube = q;
                                        x = -1; y = i; z = j;
                                    }
                                    else if (rubicsPage[j][1][i].children[0] == clickedObjects[ q ].object) {
                                        foundedCube = q;
                                        x = j; y = 1; z = i;
                                    }
                                    if (foundedCube) {
                                        break;
                                    }
                                }
                                if (foundedCube) {
                                    break;
                                }
                            }
                            if (foundedCube) {
                                break;
                            }
                        }
                        
                        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                            
                            mouseState = MOUSE_STATE_CLICK_CAPTURED;
                            
                            rotatePage(x, y, z, x1 == x2, y1 == y2, z1 == z2, y1 > y2, z1 < z2, y1 > y2);
                        }
                        else {
                            mouseState = MOUSE_STATE_CLICK_RELEASED;
                        }
                    }
                }
            }
        }
        else if (MOUSE_STATE_AXIS == mouseState) {
            mX = mouseX - windowHalfX;
            mY = mouseY - windowHalfY;
            
            mouseXDelta = mX - mouseXOnMouseDown;
            mouseYDelta = mY - mouseYOnMouseDown;
            
            var axis = '';
            if ((Math.abs(mouseXDelta) > 10 || Math.abs(mouseYDelta) > 10)) {
                
                mouseState = MOUSE_STATE_CLICK_CAPTURED;
                
                if (Math.abs(mouseXDelta) > Math.abs(mouseYDelta)) {
                    axis = 'y';
                }
                else {
                    axis = (mX < 0 ? 'z' : 'x');
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
    
    window.addEventListener('load', booting, false);
})();