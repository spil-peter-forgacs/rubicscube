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
    // Pages around the cube.
    // Used for capturing the movements.
    var cubePage = [];
    
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
    var clickedObjects = [];
    
    var gameStates = {'loading': 0, 'playing': 1, 'movepage': 2, 'solve': 3, 'shuffle': 4};
    var gameState = gameStates.loading;
    
    // Preloader
    var imageObj;
    
    var touches;
    
    /**
     * Full screen
     */
    function launchFullscreen(element) {
      // Find the right method, call on correct element
      if(element.requestFullscreen) {
        element.requestFullscreen();
      } else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
    // Launch fullscreen for browsers that support it!
    //launchFullscreen(document.documentElement); // the whole page
    
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
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: 0,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['solve'].src,
            cb: solveCube
        });
        addMenuItem({
            id: 'shuffleCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: 1.1 * widthHeight,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['shuffle'].src, cb: shuffleCube
        });
        
        var scoreboard = new Scoreboard();
        scoreboard.message("Rubic's cube");
        scoreboard.help('Shuffle the cube with the shuffle button.' +
            'Then you can move the pages touching the cube and moving to the right direction.'+
            'You can mobe the cube too, if you wipe the screen outside of the cube (bottom, left, right).' +
            'If you want to restart, click to the solve button.');
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
        
        randomMove(Math.floor(Math.random() * 4) + 10);
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
        scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
        
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
        
        // Pages.
        var shape = new THREE.PlaneGeometry(3, 3);
        var materials = [
            new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.0 } )
        ];
        var cover = new THREE.MeshFaceMaterial( materials );
        // Right
        var i = 0;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].position.set(0, 0, 1.5);
        // Top
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.x = -Math.PI / 2;
        cubePage[i].position.set(0, 1.5, 0);
        // Left
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubicsCube.add(cubePage[i]);
        cubePage[i].rotation.y = -Math.PI / 2;
        cubePage[i].position.set(-1.5, 0, 0);
        
        // Light
        
        if (!is_touch_device()) {
            var sunIntensity = 0.8;
            var pointIntensity = 0.6;
            
            ambientLight = new THREE.AmbientLight( 0x999999 );
            scene.add( ambientLight );
            
            pointLight = new THREE.PointLight( 0xeeeeee, pointIntensity, 5000 );
            pointLight.position.set( -10, -10, -10 );
            scene.add( pointLight );
            pointLight2 = new THREE.PointLight( 0xeeeeee, pointIntensity, 5000 );
            pointLight2.position.set( 10, -10, -10 );
            scene.add( pointLight2 );
            pointLight3 = new THREE.PointLight( 0xeeeeee, pointIntensity, 5000 );
            pointLight3.position.set( 0, 1000, 10 );
            scene.add( pointLight3 );
            
            sunLight = new THREE.SpotLight( 0xbbbbbb, sunIntensity, 0, Math.PI/2, 1 );
            sunLight.position.set( 100, -200, -100 );
            //sunLight.castShadow = true;
            //sunLight.shadowDarkness = 0.3 * sunIntensity;
            //sunLight.shadowBias = -0.0002;
            //sunLight.shadowCameraNear = 750;
            //sunLight.shadowCameraFar = 4000;
            //sunLight.shadowCameraFov = 30;
            //sunLight.shadowCameraVisible = false;
            scene.add( sunLight );
            
            sunLight2 = new THREE.SpotLight( 0xbbbbbb, sunIntensity, 0, Math.PI/2, 1 );
            sunLight2.position.set( -100, -200, -100 );
            scene.add( sunLight2 );
        }
        
        
        // Cube
        
        createCubeMesh();
        
        
        // Particles
        
        var geometry = new THREE.Geometry();
        var sprite = THREE.ImageUtils.loadTexture( imageObj['disc'].src );
        for ( i = 0; i < 2000; i ++ ) {
            var vertex = new THREE.Vector3();
            vertex.x = 2000 * Math.random() - 1000;
            vertex.y = -2000 * Math.random() + 1000;
            vertex.z = -2000 * Math.random() + 1000;
            
            geometry.vertices.push( vertex );
        }
        material = new THREE.ParticleSystemMaterial( { size: (is_touch_device() ? 15 : 5), sizeAttenuation: false, map: sprite, transparent: true } );
        material.color.setHSL( 0.6, 0.5, 0.5 );
        particles = new THREE.ParticleSystem( geometry, material );
        particles.sortParticles = true;
        scene.add( particles );
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
            new THREE.ImageUtils.loadTexture(imageObj['orange'].src),
            new THREE.ImageUtils.loadTexture(imageObj['red'].src),
            new THREE.ImageUtils.loadTexture(imageObj['white'].src),
            new THREE.ImageUtils.loadTexture(imageObj['yellow'].src),
            new THREE.ImageUtils.loadTexture(imageObj['blue'].src),
            new THREE.ImageUtils.loadTexture(imageObj['green'].src),
            new THREE.ImageUtils.loadTexture(imageObj['gray2'].src),
            new THREE.ImageUtils.loadTexture(imageObj['whitespil'].src),
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
                    var cubeMaterials;
                    if (is_touch_device()) {
                        var cubeMaterials = [
                            new THREE.MeshBasicMaterial({map:cubeTexture[0]}),
                            new THREE.MeshBasicMaterial({map:cubeTexture[1]}),
                            new THREE.MeshBasicMaterial({map:cubeTexture[2]}),
                            new THREE.MeshBasicMaterial({map:cubeTexture[3]}),
                            new THREE.MeshBasicMaterial({map:cubeTexture[4]}),
                            new THREE.MeshBasicMaterial({map:cubeTexture[5]}),
                        ];
                    }
                    else {
                        //var phongSettings = { shininess: 75, ambient: 0xffffff, color: 0xffffff, specular: 0xffffff, map:null};
                        var cubeMaterials = [
                            new THREE.MeshPhongMaterial({map:cubeTexture[0]}),
                            new THREE.MeshPhongMaterial({map:cubeTexture[1]}),
                            new THREE.MeshPhongMaterial({map:cubeTexture[2]}),
                            new THREE.MeshPhongMaterial({map:cubeTexture[3]}),
                            new THREE.MeshPhongMaterial({map:cubeTexture[4]}),
                            new THREE.MeshPhongMaterial({map:cubeTexture[5]}),
                        ];
                    }
                    // Make the non visible sides black.
                    var cubeMaterialsTmp;
                    if (is_touch_device()) {
                        cubeMaterialsTmp = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
                    }
                    else {
                        cubeMaterialsTmp = new THREE.MeshPhongMaterial({map:cubeTexture[6]});
                    }
                    if (1 != i) {
                        cubeMaterials[0] = cubeMaterialsTmp;
                    }
                    if (-1 != i) {
                        cubeMaterials[1] = cubeMaterialsTmp;
                    }
                    if (1 != j) {
                        cubeMaterials[2] = cubeMaterialsTmp;
                    }
                    if (-1 != j) {
                        cubeMaterials[3] = cubeMaterialsTmp;
                    }
                    if (1 != k) {
                        cubeMaterials[4] = cubeMaterialsTmp;
                    }
                    if (-1 != k) {
                        cubeMaterials[5] = cubeMaterialsTmp;
                    }
                    
                    // Logo on middle white item.
                    if (0 == i && 1 == j && 0 == k) {
                        if (is_touch_device()) {
                            cubeMaterials[2] = new THREE.MeshBasicMaterial({map:cubeTexture[7]});
                        }
                        else {
                            cubeMaterials[2] = new THREE.MeshPhongMaterial({map:cubeTexture[7]});
                        }
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
        if (!is_touch_device()) {
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
            return;
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
        
        var time = Date.now() * 0.00005;
        //h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
        //material.color.setHSL( h, 0.5, 0.5 );
        
        //var alpha = h * 2 * Math.PI;
        //particles.position.x = 100 * Math.sin(alpha);
        //particles.position.y = 100 * Math.cos(alpha);
        //particles.position.z = 100 * Math.sin(alpha);
        particles.rotation.y = time / 10;
        
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
            
            touches = event.touches;
            
            pointerDown(mouseX, mouseY);
        }
    }
    
    function onDocumentTouchMove( event ) {
        event.preventDefault();
        
        pointerMove();
        
        touches = event.touches;
    }
    
    function onDocumentTouchEnd( event ) {
        if ( touches && touches.length === 1 ) {
            event.preventDefault();
            
            mouseX = touches[ 0 ].pageX;
            mouseY = touches[ 0 ].pageY;
            
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
        
        clickedObjects['page'] = getClickTargetObjects(mouseX, mouseY, false);
        clickedObjects['cube'] = getClickTargetObjects(mouseX, mouseY, true);
        
        mouseXOnMouseDown = mouseX - windowHalfX;
        mouseYOnMouseDown = mouseY - windowHalfY;
    }
    
    function pointerUp(mouseX, mouseY) {
        if (mouseState != mouseStates.clicked) {
            return;
        }
        
        var intersects = [];
        intersects['page'] = getClickTargetObjects(mouseX, mouseY, false);
        intersects['cube'] = getClickTargetObjects(mouseX, mouseY, true);
        
        // Move page.
        if (intersects['page'].length > 0 && clickedObjects['page'].length > 0 && intersects['cube'].length > 0 && clickedObjects['cube'].length > 0) {
            
            gameState = gameStates.movepage;
            
            var x1Cube = clickedObjects['cube'][0].object.cubeX;
            var y1Cube = clickedObjects['cube'][0].object.cubeY;
            var z1Cube = clickedObjects['cube'][0].object.cubeZ;
            var x2Cube = intersects['cube'][0].object.cubeX;
            var y2Cube = intersects['cube'][0].object.cubeY;
            var z2Cube = intersects['cube'][0].object.cubeZ;
            
            var x1Page = clickedObjects['page'][ 0 ].object.position.x;
            var y1Page = clickedObjects['page'][ 0 ].object.position.y;
            var z1Page = clickedObjects['page'][ 0 ].object.position.z;
            var x2Page = intersects['page'][ 0 ].object.position.x;
            var y2Page = intersects['page'][ 0 ].object.position.y;
            var z2Page = intersects['page'][ 0 ].object.position.z;
            
            // Move through the edge.
            if (clickedObjects['page'][ 0 ].object != intersects['page'][ 0 ].object) {
                var xStatic = x1Page == x2Page;
                var yStatic = y1Page == y2Page;
                var zStatic = z1Page == z2Page;
                var xDirection = y1Page > y2Page;
                var yDirection = z1Page < z2Page;
                var zDirection = y1Page > y2Page;
                
                rotatePage(
                    x1Cube, y1Cube, z1Cube,
                    xStatic, yStatic, zStatic,
                    xDirection, yDirection, zDirection
                );
            }
            // Move on the side.
            else if (clickedObjects['cube'][ 0 ].object != intersects['cube'][ 0 ].object) {
                var xStatic = (0 != y1Page || 0 != z1Page) && x1Cube == x2Cube;
                var yStatic = (0 != x1Page || 0 != z1Page) && y1Cube == y2Cube;
                var zStatic = (0 != x1Page || 0 != y1Page) && z1Cube == z2Cube;
                var xDirection = (0 != y1Page ? z2Cube > z1Cube : y2Cube < y1Cube);
                var yDirection = (0 != x1Page ? z2Cube > z1Cube : x2Cube > x1Cube);
                var zDirection = (0 != x1Page ? y2Cube < y1Cube : x2Cube < x1Cube);
                
                if ((xStatic && !yStatic && !zStatic) ||
                    (!xStatic && yStatic && !zStatic) ||
                    (!xStatic && !yStatic && zStatic)) {
                    rotatePage(
                        x1Cube, y1Cube, z1Cube,
                        xStatic, yStatic, zStatic,
                        xDirection, yDirection, zDirection
                    );
                }
            }
        }
        // Move cube
        else if (intersects['page'].length == 0 && clickedObjects['page'].length == 0) {
            mX = mouseX - windowHalfX;
            mY = mouseY - windowHalfY;
            
            mouseXDelta = mX - mouseXOnMouseDown;
            mouseYDelta = mY - mouseYOnMouseDown;
            
            var mouseXDeltaAbs = Math.abs(mouseXDelta);
            var mouseYDeltaAbs = Math.abs(mouseYDelta);
            
            var axis = '';
            if ((mouseXDeltaAbs > 20 && mouseYDeltaAbs < mouseXDeltaAbs / 2) ||
                (mouseYDeltaAbs > 20 && mouseXDeltaAbs < mouseYDeltaAbs / 2)) {
                
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
                    //yDirection = ((mouseXDelta >= 0 && mY >= -windowHalfY * 0.8) || (mouseXDelta < 0 && mY < -windowHalfY * 0.8));
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
        
        mouseState = mouseStates.released;
    }
    
    /**
     * Getting the clicked objects.
     */
    function getClickTargetObjects(eventX, eventY, isCube) {
        var vector = new THREE.Vector3( ( eventX / window.innerWidth ) * 2 - 1, - ( eventY / window.innerHeight ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );
        
        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
        
        var children = [];
        if (isCube) {
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
        }
        else {
            children = cubePage;
        }
        
        // This gives back all the cubes intersected with the project vector.
        // It is ordered by distance.
        var intersects = raycaster.intersectObjects( children );
        
        return intersects;
    }
    
    function is_touch_device() {
        return !!('ontouchstart' in window);
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
        
        // Create objects.
        imageObj = [];
        imageObj['orange'] = new Image();
        imageObj['orange'].src = 'pics/orange.jpg';
        imageObj['red'] = new Image();
        imageObj['red'].src = 'pics/red.jpg';
        imageObj['white'] = new Image();
        imageObj['white'].src = 'pics/white.jpg';
        imageObj['yellow'] = new Image();
        imageObj['yellow'].src = 'pics/yellow.jpg';
        imageObj['blue'] = new Image();
        imageObj['blue'].src = 'pics/blue.jpg';
        imageObj['green'] = new Image();
        imageObj['green'].src = 'pics/green.jpg';
        imageObj['gray2'] = new Image();
        imageObj['gray2'].src = 'pics/gray2.png';
        imageObj['whitespil'] = new Image();
        imageObj['whitespil'].src = 'pics/whitespil.jpg';
        imageObj['solve'] = new Image();
        imageObj['solve'].src = 'pics/solve.png';
        imageObj['shuffle'] = new Image();
        imageObj['shuffle'].src = 'pics/shuffle.png';
        imageObj['disc'] = new Image();
        imageObj['disc'].src = 'pics/disc.png';
    }
    preloadResources();
    
    window.addEventListener('load', booting, false);
})();
