/**
 * Rubic's Cube
 * 
 * @author Peter Forgacs
 * @version 1.0
 * @created 31-March-2014 - 11-April-2014
 */

var game = (function(){
    
    // Basic variables for 3d.
    var scene, camera, renderer;
    
    // Whole cube.
    var rubicsCube;
    // Container of small cubes.
    var rubicsPage = [];
    // Small cubes.
    var cubeMesh = [];
    
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var xBiggerY = (windowHalfX > windowHalfY);
    
    // Mouse states
    var mouseStates = {'released':1, 'clicked':2};
    var mouseState = mouseStates.released;
    
    // Mouse data
    var mouseX = 0;
    var mouseY = 0;
    var mouseXOnMouseDown = 0;
    var mouseYOnMouseDown = 0;
    var mouseXDelta = 0;
    var mouseYDelta = 0;
    
    // Variables for the click event
    var projector = new THREE.Projector();
    var clickedObjects;
    
    var gameStates = {'loading': 0, 'playing': 1, 'movepage': 2, 'solve': 3, 'shuffle': 4};
    var gameState = gameStates.loading;
    
    // Preloader
    var imageObj;
    
    /**
     * Booting.
     */
    function booting() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        
        window.addEventListener('resize', onWindowResize, false);
        
        // Normal mouse events.
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        document.addEventListener( 'mouseup', onDocumentMouseUp, false );
        document.addEventListener( 'mouseout', onDocumentMouseOut, false );
        
        // Touch events.
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );
        document.addEventListener( 'touchend', onDocumentTouchEnd, false );
        document.addEventListener( 'touchenter', onDocumentTouchEnter, false );
        document.addEventListener( 'touchleave', onDocumentTouchLeave, false );
        document.addEventListener( 'touchcancel', onDocumentTouchCancel, false );
        
        initializeMenu();
        
        // Initialize and start animating.
        initializeScene();
        animateScene();
        
        gameState = gameStates.playing;
    }
    
    /**
     * Initialize menu.
     */
    function initializeMenu() {
        var widthHeight = (xBiggerY ? windowHalfY * 0.3 : windowHalfX * 0.3);
        
        removeMenuItem('solveCube');
        removeMenuItem('shuffleCube');
        
        addMenuItem({
            id: 'solveCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.6 : 0.9)),
            y: 0,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj[8].src,
            cb: solveCube
        });
        addMenuItem({
            id: 'shuffleCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.6 : 0.9)),
            y: 1.1 * widthHeight,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj[9].src, cb: shuffleCube
        });
    }
    
    /**
     * Remove menu item.
     */
    function removeMenuItem(id) {
        var element = document.getElementById( id );
        if (element) {
            document.getElementById( id ).remove();
        }
    }
    
    /**
     * Create menu elements.
     */
    function addMenuItem(menuObject) {
        var thisOpacity = 0.7;
        
        var menuContainer = document.createElement('img');
        menuContainer.id = menuObject.id;
        menuContainer.style.position = 'absolute';
        menuContainer.style.backgroundColor = 'black';
        menuContainer.style.opacity = thisOpacity;
        menuContainer.style.borderRadius = "5px";
        menuContainer.style.padding = "5px 20px";
        menuContainer.style.left = menuObject.x + 'px';
        menuContainer.style.top = menuObject.y + 'px';
        menuContainer.style.width = menuObject.width + "px";
        menuContainer.style.height = menuObject.height + "px";
        menuContainer.style.color = 'yellow';
        
        menuContainer.src = menuObject.pic;
        
        var menuContainerMouseUp = function () {
            mouseState = mouseStates.released;
            menuObject.cb();
            
            // Animate.
            var opacityDirection = 0.1;
            var animMenu = function () {
                setTimeout(function () {
                    if (parseFloat(menuContainer.style.opacity) >= 1) {
                        opacityDirection = -opacityDirection;
                    }
                    menuContainer.style.opacity = parseFloat(menuContainer.style.opacity) + opacityDirection;
                    
                    if (parseFloat(menuContainer.style.opacity) > thisOpacity) {
                        animMenu();
                    }
                }, 20);
            }
            animMenu();
        };
        menuContainer.addEventListener( 'mouseup', menuContainerMouseUp, false );
        menuContainer.addEventListener( 'touchend', menuContainerMouseUp, false );
        
        document.body.appendChild(menuContainer);
    }
    
    function solveCube() {
        if (gameState != gameStates.playing) {
            return;
        }
        
        gameState = gameStates.solve;
        
        Sounds.snick.play();
        createCubeMesh();
        
        gameState = gameStates.playing;
    }
    
    function shuffleCube() {
        if (gameState != gameStates.playing) {
            return;
        }
        
        Sounds.drip.play();
        gameState = gameStates.shuffle;
        
        randomMove(Math.floor(Math.random() * 4) + 5);
    }
    
    function randomMove(i) {
        if (i <= 0) {
            return;
        }
        
        var x = y = z = 0;
        var xStatic = yStatic = zStatic = false;
        var xDirection = yDirection = zDirection = null;
        var axis = Math.floor(Math.random() * 3);
        
        if (0 == axis) {
            xStatic = true;
            xDirection = (Math.floor(Math.random() * 2) >= 1);
            x = Math.floor(Math.random() * 3) - 1;
        }
        else if (1 == axis) {
            yStatic = true;
            yDirection = (Math.floor(Math.random() * 2) >= 1);
            y = Math.floor(Math.random() * 3) - 1;
        }
        else if (2 == axis) {
            zStatic = true;
            zDirection = (Math.floor(Math.random() * 2) >= 1);
            z = Math.floor(Math.random() * 3) - 1;
        }
        
        rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, randomMove, i);
    }
    
    /**
     * Initialize scene.
     */
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
        document.body.appendChild(renderer.domElement);
        
        
        // Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...).
        scene = new THREE.Scene();
        
        var aspect = canvasWidth / canvasHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
        camera.position.set(0, 0, 9);
        scene.add(camera);
        camera.lookAt(scene.position);
        
        
        //
        // Rubic's cube.
        //
        
        // The Rubic's cube.
        rubicsCube = new THREE.Object3D();
        scene.add(rubicsCube);
        
        // Rotation
        rubicsCube.rotation.y = Math.PI / 4;
        rubicsCube.rotation.x = Math.PI / 5;
        
        // Light
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0,0,1000);
        scene.add(light);
        
        createCubeMesh();
    }
    
    function createCubeMesh() {
        // Remove previous cube, if there is any.
        if (cubeMesh[0]) {
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    for (var k = -1; k <= 1; k++) {
                        rubicsPage[i][j][k].remove(cubeMesh[i][j][k]);
                        rubicsCube.remove(rubicsPage[i][j][k]);
                    }
                }
            }
        }
        
        // Create the cube.
        // When the CanvasRenderer is used, the texture has some distortions.
        // To get rid of this, you only have to increase the number of cube segments.
        // The WebGLRenderer doesn't needs this workaround.
        // Original: var cubeGeometry = new THREE.CubeGeometry(2.0, 2.0, 2.0);
        var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0, 4, 4, 4);
        // Load images as textures.
        var cubeTexture = [
            new THREE.ImageUtils.loadTexture(imageObj[0].src),
            new THREE.ImageUtils.loadTexture(imageObj[1].src),
            new THREE.ImageUtils.loadTexture(imageObj[2].src),
            new THREE.ImageUtils.loadTexture(imageObj[3].src),
            new THREE.ImageUtils.loadTexture(imageObj[4].src),
            new THREE.ImageUtils.loadTexture(imageObj[5].src),
            new THREE.ImageUtils.loadTexture(imageObj[6].src),
            new THREE.ImageUtils.loadTexture(imageObj[7].src),
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
                    
                    // Logo on middle white item.
                    if (0 == i && 1 == j && 0 == k) {
                        cubeMaterials[2] = new THREE.MeshBasicMaterial({map:cubeTexture[7]});
                    }
                    
                    // Create a MeshFaceMaterial, which allows the cube to have different materials on each face.
                    var cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
                    cubeMesh[i][j][k] = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    cubeMesh[i][j][k].position.set(i, j, k);
                    
                    // Containers.
                    rubicsPage[i][j][k] = new THREE.Object3D();
                    rubicsCube.add(rubicsPage[i][j][k]);
                    
                    // Name it for debugging reason.
                    cubeMesh[i][j][k].name = i + ',' + j + ',' + k;
                    rubicsPage[i][j][k].name = i + ',' + j + ',' + k;
                    
                    // Add the small cubes to their container.
                    rubicsPage[i][j][k].add(cubeMesh[i][j][k]);
                }
            }
        }
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
     * 
     * @param x integer X coordinate of rotation
     * @param y integer Y coordinate of rotation
     * @param z integer Z coordinate of rotation
     * @param xStatic boolean True, if X is the rotation axis
     * @param yStatic boolean True, if Y is the rotation axis
     * @param zStatic boolean True, if Z is the rotation axis
     * @param xDirection boolean True, if X rotation is clockwise
     * @param yDirection boolean True, if Y rotation is clockwise
     * @param zDirection boolean True, if Z rotation is clockwise
     */
    function rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, cb, i) {
        // Play sound, if it is not shuffle.
        // Mobile devices can't handle so much requests.
        if (!cb) {
            Sounds.scratch.play();
        }
        
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
        // Animate the cube movements
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
                
                if (cb && !isNaN(i) && i > 1) {
                    i--;
                    cb(i);
                }
                else {
                    gameState = gameStates.playing;
                }
            }
        }
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
    
    /**
     * Animate the scene time to time.
     */
    function animateScene() {
        requestAnimationFrame(animateScene);
        
        renderer.render(scene, camera);
    }
    
    /**
     * Mouse events.
     */
    
    function onDocumentMouseDown( event ) {
        event.preventDefault();
        
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        pointerDown(mouseX, mouseY);
    }
    
    function onDocumentMouseMove( event ) {
        event.preventDefault();
        
        pointerMove();
    }
    
    function onDocumentMouseUp( event ) {
        event.preventDefault();
        
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        pointerUp(mouseX, mouseY);
    }
    
    function onDocumentMouseOut( event ) {
        pointerOut();
    }
    
    function onDocumentTouchStart( event ) {
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            
            mouseX = event.touches[ 0 ].pageX;
            mouseY = event.touches[ 0 ].pageY;
            
            pointerDown(mouseX, mouseY);
        }
    }
    
    function onDocumentTouchMove( event ) {
        event.preventDefault();
        
        pointerMove();
    }
    
    function onDocumentTouchEnd( event ) {
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            
            mouseX = event.touches[ 0 ].pageX;
            mouseY = event.touches[ 0 ].pageY;
            
            pointerUp(mouseX, mouseY);
        }
    }
    
    function onDocumentTouchEnter( event ) {
    }
    
    function onDocumentTouchLeave( event ) {
        pointerOut();
    }
    
    function onDocumentTouchCancel( event ) {
        pointerOut();
    }
    
    function pointerMove() {
    }
    
    function pointerOut() {
        mouseState = mouseStates.released;
    }
    
    function pointerDown(mouseX, mouseY) {
        if (mouseState != mouseStates.released) {
            return;
        }
        
        mouseState = mouseStates.clicked;
        
        var intersects = getClickTargetObjects(mouseX, mouseY);
        clickedObjects = intersects;
        
        mouseXOnMouseDown = mouseX - windowHalfX;
        mouseYOnMouseDown = mouseY - windowHalfY;
    }
    
    function pointerUp(mouseX, mouseY) {
        if (mouseState != mouseStates.clicked) {
            return;
        }
        
        var intersects = getClickTargetObjects(mouseX, mouseY);
        
        if (intersects.length > 0 && clickedObjects.length > 0) {
            // Don't move, if it is the same small cube.
            if (clickedObjects[0].object != intersects[ 0 ].object) {
                
                gameState = gameStates.movepage;
                
                x1 = clickedObjects[0].object.cubeX;
                y1 = clickedObjects[0].object.cubeY;
                z1 = clickedObjects[0].object.cubeZ;
                x2 = intersects[0].object.cubeX;
                y2 = intersects[0].object.cubeY;
                z2 = intersects[0].object.cubeZ;
                
                console.warn('released', clickedObjects[0].object.name, intersects[0].object.name, clickedObjects, intersects);
                console.warn('released2', clickedObjects[0].object.cubeX, clickedObjects[0].object.cubeY, clickedObjects[0].object.cubeZ);
                console.warn('released3', intersects[0].object.cubeX, intersects[0].object.cubeY, intersects[0].object.cubeZ);
                console.warn('xyz1', x1, y1, z1);
                console.warn('xyz2', x2, y2, z2);
                console.warn('rotate', x1, y1, z1, x1 == x2, y1 == y2, z1 == z2, y1 > y2, z1 < z2, y1 > y2);
                rotatePage(x1, y1, z1, x1 == x2, y1 == y2, z1 == z2, y1 > y2, z1 < z2, y1 > y2);
                
                /*
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
                        
                        gameState = gameStates.movepage;
                        
                        rotatePage(x, y, z, x1 == x2, y1 == y2, z1 == z2, y1 > y2, z1 < z2, y1 > y2);
                    }
                }
                */
            }
        }
        else if (intersects.length == 0 && clickedObjects.length == 0) {
            mX = mouseX - windowHalfX;
            mY = mouseY - windowHalfY;
            
            mouseXDelta = mX - mouseXOnMouseDown;
            mouseYDelta = mY - mouseYOnMouseDown;
            
            var axis = '';
            if ((Math.abs(mouseXDelta) > 40 || Math.abs(mouseYDelta) > 40)) {
                
                gameState = gameStates.movepage;
                
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
                    // There are different rotation on the top and on the bottom of cube.
                    yDirection = ((mouseXDelta >= 0 && mY >= 0) || (mouseXDelta < 0 && mY < 0));
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
        
        mouseState = mouseStates.released;
    }
    
    /**
     * Getting the clicked objects.
     */
    function getClickTargetObjects(eventX, eventY) {
        var vector = new THREE.Vector3( ( eventX / window.innerWidth ) * 2 - 1, - ( eventY / window.innerHeight ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );
        
        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
        
        var children = [];
        // Top.
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                rubicsPage[i][1][j].children[0].cubeX = i;
                rubicsPage[i][1][j].children[0].cubeY = 1;
                rubicsPage[i][1][j].children[0].cubeZ = j;
                
                children.push(rubicsPage[i][1][j].children[0]);
            }
        }
        // Left.
        // Don't add top again.
        for (var i = -1; i <= 0; i++) {
            for (var j = -1; j <= 1; j++) {
                rubicsPage[-1][i][j].children[0].cubeX = -1;
                rubicsPage[-1][i][j].children[0].cubeY = i;
                rubicsPage[-1][i][j].children[0].cubeZ = j;
                
                children.push(rubicsPage[-1][i][j].children[0]);
            }
        }
        // Right.
        // Don't add top and left again.
        for (var i = 0; i <= 1; i++) {
            for (var j = -1; j <= 0; j++) {
                rubicsPage[i][j][1].children[0].cubeX = i;
                rubicsPage[i][j][1].children[0].cubeY = j;
                rubicsPage[i][j][1].children[0].cubeZ = 1;
                
                children.push(rubicsPage[i][j][1].children[0]);
            }
        }
        
        // This gives back all the cubes intersected with the project vector.
        // It is ordered by distance.
        var intersects = raycaster.intersectObjects( children );
        
        return intersects;
    }
    
    
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        xBiggerY = (windowHalfX > windowHalfY);
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize( window.innerWidth, window.innerHeight );
        
        initializeMenu();
    }
    
    
    // Writing some basic texts.
    var writeTextContainer;
    function writeText(text) {
        if (!writeTextContainer) {
            writeTextContainer = document.createElement('div');
            writeTextContainer.id = 'gameinfo';
            writeTextContainer.style.position = 'absolute';
            writeTextContainer.style.backgroundColor = 'black';
            writeTextContainer.style.opacity = 0.7;
            writeTextContainer.style.borderRadius = "5px";
            writeTextContainer.style.padding = "5px 20px";
            writeTextContainer.style.left = (windowHalfX / 2) + 'px';
            writeTextContainer.style.top = (windowHalfY / 2) + 'px';
            //writeTextContainer.style.width = (window.innerWidth * 0.2) + "px";
            //writeTextContainer.style.minWidth = '10px';
            writeTextContainer.style.color = 'yellow';
            writeTextContainer.style.fontFamily = 'Arial, San Serif';
            writeTextContainer.style.fontWeight = 'bold';
            writeTextContainer.style.fontSize = (window.innerHeight * 0.033) + "px";
            
            document.body.appendChild(writeTextContainer);
        }
        
        writeTextContainer.innerHTML = text;
    }
    function clearText() {
        if (!writeTextContainer) {
            return;
        }
        
        document.body.removeChild(writeTextContainer);
    }
    
    /**
     * Preloader.
     */
    function preloadResources() {
        document.body.style.margin = 0;
        document.body.style.overflow = 'hidden';
        
        var text = 'Loading, please wait.';
        var textEnding = '';
        writeText(text);
        
        animateText();
        function animateText() {
            setTimeout(
                function () {
                    if (textEnding.length < 2) {
                        textEnding += '.';
                    }
                    else {
                        textEnding = '';
                    }
                    writeText(text + textEnding);
                    
                    if (gameState == gameStates.loading) {
                        animateText();
                    }
                    else {
                        clearText();
                    }
                },
                200
            );
        }
        
        // Counter.
        var i = 0;
        // Create objects.
        imageObj = [];
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/orange.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/red.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/white.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/yellow.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/blue.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/green.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/gray2.png';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/whitespil.jpg';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/solve.png';
        i++;
        imageObj[i] = new Image();
        imageObj[i].src = 'pics/shuffle.png';
        i++;
    }
    preloadResources();
    
    window.addEventListener('load', booting, false);
})();
