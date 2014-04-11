/**
 * Rubik's Cube
 * 
 * @author Peter Forgacs
 * @version 1.0
 * @created 31-March-2014 - 11-April-2014
 */

var game = (function(){
    
    // Basic variables for 3d.
    var scene, camera, renderer;
    
    // Whole cube.
    var rubiksCube;
    // Container of small cubes.
    var rubiksPage = [];
    // Small cubes.
    var cubeMesh = [];
    // Pages around the cube.
    // Used for capturing the movements.
    var cubePage = [];
    // Cube image textures
    var cubeTexture;
    
    // Background element.
    var bgScene = new THREE.Scene();
    var bgCam = new THREE.Camera();
    
    // Window size and aspect.
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
    
    // Game states.
    var gameStates = {'loading': 0, 'playing': 1, 'movepage': 2, 'solve': 3, 'shuffle': 4, 'movehistory' : 5};
    var gameState = gameStates.loading;
    
    // Name of the game.
    var gameName = "Rubik's Cube";
    
    // Preloader
    var imageObj;
    
    // Storing touches.
    var touches;
    
    // Scoreboard.
    var scoreboard = new Scoreboard();
    var isTimerShow = false;
    var topScore;
    
    // Sound (music).
    var sound;
    var soundVolume = 0.5;
    
    // Store the rotated state of cube.
    // Used in rotate button.
    var isRotated = false;
    
    // Detect iOS.
    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
    
    // Music.
    var isMusic = (!iOS);
    
    // History.
    var isHistory = (!iOS);
    
    // Animation.
    var isAnimation = (!iOS);
    
    // Timer.
    var isTimer = (!iOS);
    
    var isScoreboard = (!iOS);
    
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
        
        // Sound.
        if (isMusic) {
            var isPlay = (fancy3D() ? localStorage.getItem('rubikMusic') : false);
            isPlay = (isPlay === 'true' || isPlay === null);
            sound = new Howl({
                urls: ['music/Pamgaea.mp3'],
                autoplay: isPlay,
                loop: true,
                volume: (isPlay ? soundVolume : 0.0),
                onend: function() {
                    //
                }
            });
        }
    }
    
    /**
     * Initialize menu.
     */
    function initializeMenu() {
        var widthHeight = (xBiggerY ? windowHalfY * 0.3 : windowHalfX * 0.3);
        
        addMenuItem({
            id: 'solveCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: 0,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['solve'].src,
            onrelease: solveCube
        });
        addMenuItem({
            id: 'shuffleCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: 1.1 * widthHeight,
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['shuffle'].src,
            onrelease: shuffleCube
        });
        addMenuItem({
            id: 'goForwardCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: (2 * windowHalfY) - (2.1 * widthHeight),
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['forward'].src,
            onrelease: function () {
                if (gameState != gameStates.playing) {
                    return;
                }
                
                gameState = gameStates.movehistory;
                
                var move = (isHistory && history ? history.goForward() : false);
                if (move && move.pageRotation) {
                    // Page rotation.
                    rotatePage(move.x, move.y, move.z, move.xStatic, move.yStatic, move.zStatic, move.xDirection, move.yDirection, move.zDirection);
                }
                else {
                    // Cube rotation.
                    var x, y, z;
                    for (var i = -1; i <= 1; i++) {
                        x = (move.xRotate ? i : 0);
                        y = (move.yRotate ? i : 0);
                        z = (move.zRotate ? i : 0);
                        rotatePage(x, y, z, move.xStatic, move.yStatic, move.zStatic, move.xDirection, move.yDirection, move.zDirection);
                    }
                }
                
                setForwarBackVisibility();
            }
        });
        addMenuItem({
            id: 'goBackCube',
            x: windowHalfX - (windowHalfX * (xBiggerY ? 0.7 : 0.9)),
            y: (2 * windowHalfY) - (1.0 * widthHeight),
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['back'].src,
            onrelease: function () {
                if (gameState != gameStates.playing) {
                    return;
                }
                
                gameState = gameStates.movehistory;
                
                var move = (isHistory && history ? history.goBack() : false);
                if (move && move.pageRotation) {
                    // Page rotation.
                    rotatePage(move.x, move.y, move.z, move.xStatic, move.yStatic, move.zStatic, !move.xDirection, !move.yDirection, !move.zDirection);
                }
                else {
                    // Cube rotation.
                    var x, y, z;
                    for (var i = -1; i <= 1; i++) {
                        x = (move.xRotate ? i : 0);
                        y = (move.yRotate ? i : 0);
                        z = (move.zRotate ? i : 0);
                        rotatePage(x, y, z, move.xStatic, move.yStatic, move.zStatic, !move.xDirection, !move.yDirection, !move.zDirection);
                    }
                }
                
                setForwarBackVisibility();
                
                // Stepped back. Don't need timer.
                if (isScoreboard && isTimer && isTimerShow) {
                    scoreboard.hideTimer();
                    scoreboard.resetTimer();
                    scoreboard.stopTimer();
                }
                isTimerShow = false;
            }
        });
        if (isMusic) {
            addMenuItem({
                id: 'music',
                x: windowHalfX + (windowHalfX * (xBiggerY ? 0.7 : 0.9)) - (1.1 * widthHeight),
                y: (2 * windowHalfY) - (2.1 * widthHeight),
                width: widthHeight,
                height: widthHeight,
                pic: imageObj['music'].src,
                onrelease: function () {
                    if (isMusic) {
                        // Music on-off switch.
                        var len = 1000;
                        if (sound.volume() > 0) {
                            var to = 0.0;
                            localStorage.setItem('rubikMusic', false)
                            sound.fadeOut(to, len, function  () {
                            });
                        }
                        else {
                            localStorage.setItem('rubikMusic', true)
                            sound.fadeIn(soundVolume, len, function  () {
                            });
                        }
                    }
                }
            });
        }
        addMenuItem({
            id: 'rotate',
            x: windowHalfX + (windowHalfX * (xBiggerY ? 0.7 : 0.9)) - (1.1 * widthHeight),
            y: (2 * windowHalfY) - (1.0 * widthHeight),
            width: widthHeight,
            height: widthHeight,
            pic: imageObj['rotate'].src,
            onpress: function () {
                if (!isRotated) {
                    var yAxisLocal = new THREE.Vector3(0, 1, 0);
                    rotateAroundWorldAxis(rubiksCube, yAxisLocal, Math.PI);
                    isRotated = true;
                }
            },
            onout: function () {
                // Same as onrelease.
                if (isRotated) {
                    var yAxisLocal = new THREE.Vector3(0, 1, 0);
                    rotateAroundWorldAxis(rubiksCube, yAxisLocal, Math.PI);
                    isRotated = false;
                }
            },
            onrelease: function () {
                if (isRotated) {
                    var yAxisLocal = new THREE.Vector3(0, 1, 0);
                    rotateAroundWorldAxis(rubiksCube, yAxisLocal, Math.PI);
                    isRotated = false;
                }
            }
        });
        
        setForwarBackVisibility();
        
        if (isScoreboard) {
            scoreboard.message(gameName);
            if (isTimer && scoreboard.getTime() > 0.1) {
                scoreboard.showTimer();
            }
            setTopScore(localStorage.getItem("rubikTopScore"));
            scoreboard.help('Shuffle the cube with the shuffle button.' +
                'Then you can move the pages touching the cube and moving to the right direction.'+
                'You can move the cube too, if you wipe the screen outside of the cube (bottom, left, right).' +
                //'If you want to restart, click to the solve button.<br />' +
                'Music: "Pamgaea" Kevin MacLeod (incompetech.com)<br />'+
                'Developer: Peter Forgacs');
        }
    }
    
    /**
     * Set the visibility of forward and backward buttons.
     */
    function setForwarBackVisibility() {
        if (isHistory) {
            document.getElementById('goForwardCube').style.visibility = (!history || history.isLast() ? 'hidden': 'visible');
            document.getElementById('goBackCube').style.visibility = (!history || history.isFirst() ? 'hidden': 'visible');
        }
        else {
            document.getElementById('goForwardCube').style.visibility = 'hidden';
            document.getElementById('goBackCube').style.visibility = 'hidden';
        }
    }
    
    /**
     * Create menu elements.
     * 
     * @param Object menuObject
            id: Id of element,
            x: X position,
            y: Y position,
            width: Width,
            height: Height,
            pic: Source of button picture,
            onpress: On press function (mouse and touch),
            onout: On out function (mouse and touch),
            onrelease: On release function (mouse and touch)
     */
    function addMenuItem(menuObject) {
        // Remove previous one, if there is any.
        var element = document.getElementById( menuObject.id );
        if (element) {
            document.getElementById( menuObject.id ).remove();
        }
        
        var thisOpacity = 0.7;
        
        var menuContainer = document.createElement('img');
        menuContainer.id = menuObject.id;
        //menuContainer.style.visibility = menuObject.visibility;
        //menuContainer.style.display = menuObject.display;
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
            menuObject.onrelease();
            
            // Animate.
            var opacityDirection = 0.1;
            var animMenu = function () {
                // Bright effect.
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
            if (isAnimation) {
                animMenu();
            }
        };
        menuContainer.addEventListener( 'mouseup', menuContainerMouseUp, false );
        menuContainer.addEventListener( 'touchend', menuContainerMouseUp, false );
        
        if (menuObject.onpress) {
            menuContainer.addEventListener( 'mousedown', menuObject.onpress, false );
            menuContainer.addEventListener( 'touchstart', menuObject.onpress, false );
        }
        
        if (menuObject.onout) {
            menuContainer.addEventListener( 'mouseout', menuObject.onout, false );
            menuContainer.addEventListener( 'touchleave', menuObject.onout, false );
            menuContainer.addEventListener( 'touchcancel', menuObject.onout, false );
        }
        
        document.body.appendChild(menuContainer);
    }
    
    /**
     * Solve (recreate) the cube.
     */
    function solveCube() {
        if (gameState != gameStates.playing) {
            return;
        }
        
        gameState = gameStates.solve;
        
        if (isScoreboard && isTimer && isTimerShow) {
            scoreboard.hideTimer();
            scoreboard.resetTimer();
            scoreboard.stopTimer();
        }
        isTimerShow = false;
        
        if (isHistory) {
            !history || history.empty();
            setForwarBackVisibility();
        }
        
        var isPlay = (fancy3D() ? localStorage.getItem('rubikMusic') : false);
        isPlay = (isPlay === 'true' || isPlay === null);
        if (isPlay) {
            sound = new Howl({
                urls: ['sounds/snick.mp3'],
                autoplay: true,
                loop: false,
                volume: soundVolume,
                onend: function() {
                    //
                }
            });
        }
        
        createCubeMesh();
        
        gameState = gameStates.playing;
    }
    
    /**
     * Shuffle the cube.
     */
    function shuffleCube() {
        if (gameState != gameStates.playing) {
            return;
        }
        
        gameState = gameStates.shuffle;
        
        if (isScoreboard && isTimer) {
            scoreboard.showTimer();
            scoreboard.resetTimer();
            scoreboard.startTimer();
        }
        isTimerShow = true;
        
        var isPlay = (fancy3D() ? localStorage.getItem('rubikMusic') : false);
        isPlay = (isPlay === 'true' || isPlay === null);
        if (isPlay) {
            sound = new Howl({
                urls: ['sounds/drip.mp3'],
                autoplay: true,
                loop: false,
                volume: soundVolume,
                onend: function() {
                    //
                }
            });
        }
        
        randomMove(Math.floor(Math.random() * 4) + 10);
    }
    
    /**
     * A random move.
     * 
     * @param Integer i
     *     Shows how many steps do we still need.
     */
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
        
        rotatePageHistory(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, randomMove, i);
    }
    
    function fancy3D() {
        return (Detector.webgl && !is_touch_device());
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
        // Rubik's cube.
        //
        
        // The Rubik's cube.
        rubiksCube = new THREE.Object3D();
        scene.add(rubiksCube);
        
        // Rotation
        rubiksCube.rotation.y = Math.PI / 4;
        rubiksCube.rotation.x = Math.PI / 5;
        
        // Pages.
        var shape = new THREE.PlaneGeometry(3, 3);
        var materials = [
            new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.0 } )
        ];
        var cover = new THREE.MeshFaceMaterial( materials );
        // Right
        var i = 0;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubiksCube.add(cubePage[i]);
        cubePage[i].position.set(0, 0, 1.5);
        // Top
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubiksCube.add(cubePage[i]);
        cubePage[i].rotation.x = -Math.PI / 2;
        cubePage[i].position.set(0, 1.5, 0);
        // Left
        i++;
        cubePage[i] = new THREE.Mesh(shape, cover);
        rubiksCube.add(cubePage[i]);
        cubePage[i].rotation.y = -Math.PI / 2;
        cubePage[i].position.set(-1.5, 0, 0);
        
        // Light
        
        if (fancy3D()) {
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
        
        
        // Background
        if (Detector.webgl) {
            var bg = new THREE.Mesh(
                    new THREE.PlaneGeometry(2, 2, 0),
                    new THREE.MeshBasicMaterial({map: new THREE.ImageUtils.loadTexture(imageObj['background'].src)})
                );
                // The bg plane shouldn't care about the z-buffer.
                bg.material.depthTest = false;
                bg.material.depthWrite = false;
                bgScene = new THREE.Scene();
                bgCam = new THREE.Camera();
                bgScene.add(bgCam);
                bgScene.add(bg);
        }
        
        //
        // Cube
        //
        
        // Load images as textures.
        cubeTexture = [
            new THREE.ImageUtils.loadTexture(imageObj['orange'].src),
            new THREE.ImageUtils.loadTexture(imageObj['red'].src),
            new THREE.ImageUtils.loadTexture(imageObj['white'].src),
            new THREE.ImageUtils.loadTexture(imageObj['yellow'].src),
            new THREE.ImageUtils.loadTexture(imageObj['blue'].src),
            new THREE.ImageUtils.loadTexture(imageObj['green'].src),
            new THREE.ImageUtils.loadTexture(imageObj['gray'].src),
            new THREE.ImageUtils.loadTexture(imageObj['whitespil'].src),
        ];
        // Create cube.
        createCubeMesh();
        
        
        // Particles
        
        if (fancy3D()) {
            var geometry = new THREE.Geometry();
            var sprite = THREE.ImageUtils.loadTexture( imageObj['disc'].src );
            for ( i = 0; i < 200; i ++ ) {
                var vertex = new THREE.Vector3();
                vertex.x = 2000 * Math.random() - 1000;
                vertex.y = -2000 * Math.random() + 1000;
                vertex.z = -2000 * Math.random() + 1000;
                
                geometry.vertices.push( vertex );
            }
            material = new THREE.ParticleSystemMaterial( { size: (fancy3D() ? 3 : 10), sizeAttenuation: false, map: sprite, transparent: true } );
            material.color.setHSL( 0.6, 0.5, 0.5 );
            particles = new THREE.ParticleSystem( geometry, material );
            particles.sortParticles = true;
            scene.add( particles );
        }
    }
    
    /**
     * Create the small cubes and their containers.
     */
    function createCubeMesh() {
        // Remove previous cube, if there is any.
        if (cubeMesh[0]) {
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    for (var k = -1; k <= 1; k++) {
                        rubiksPage[i][j][k].remove(cubeMesh[i][j][k]);
                        rubiksCube.remove(rubiksPage[i][j][k]);
                    }
                }
            }
        }
        
        // Create the cube.
        // When the CanvasRenderer is used, the texture has some distortions.
        // To get rid of this, you only have to increase the number of cube segments.
        // The WebGLRenderer doesn't needs this workaround.
        // Original: var cubeGeometry = new THREE.CubeGeometry(2.0, 2.0, 2.0);
        var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0, 1, 1, 1);
        
        // Cube colors: yellow, blue, red, green, orange, white
        // Color order:
        //  y   (Top)
        // brgo (Side)
        //  w   (Bottom)
        
        for (var i = -1; i <= 1; i++) {
            cubeMesh[i] = [];
            rubiksPage[i] = [];
            for (var j = -1; j <= 1; j++) {
                cubeMesh[i][j] = [];
                rubiksPage[i][j] = [];
                for (var k = -1; k <= 1; k++) {
                    // Define six texture materials.
                    var cubeMaterials;
                    if (fancy3D()) {
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
                    else {
                        var cubeMaterials = [
                             new THREE.MeshBasicMaterial({map:cubeTexture[0]}),
                             new THREE.MeshBasicMaterial({map:cubeTexture[1]}),
                             new THREE.MeshBasicMaterial({map:cubeTexture[2]}),
                             new THREE.MeshBasicMaterial({map:cubeTexture[3]}),
                             new THREE.MeshBasicMaterial({map:cubeTexture[4]}),
                             new THREE.MeshBasicMaterial({map:cubeTexture[5]}),
                         ];
                    }
                    // Make the non visible sides black.
                    var cubeMaterialsTmp;
                    if (fancy3D()) {
                        cubeMaterialsTmp = new THREE.MeshPhongMaterial({map:cubeTexture[6]});
                    }
                    else {
                        cubeMaterialsTmp = new THREE.MeshBasicMaterial({map:cubeTexture[6]});
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
                        if (fancy3D()) {
                            cubeMaterials[2] = new THREE.MeshPhongMaterial({map:cubeTexture[7]});
                        }
                        else {
                            cubeMaterials[2] = new THREE.MeshBasicMaterial({map:cubeTexture[7]});
                        }
                    }
                    
                    // Create a MeshFaceMaterial, which allows the cube to have different materials on each face.
                    var cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
                    cubeMesh[i][j][k] = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    cubeMesh[i][j][k].position.set(i, j, k);
                    
                    // Containers.
                    rubiksPage[i][j][k] = new THREE.Object3D();
                    rubiksCube.add(rubiksPage[i][j][k]);
                    
                    // Name it for debugging reason.
                    cubeMesh[i][j][k].name = i + ',' + j + ',' + k;
                    rubiksPage[i][j][k].name = i + ',' + j + ',' + k;
                    rubiksPage[i][j][k].pageX = i;
                    rubiksPage[i][j][k].pageY = j;
                    rubiksPage[i][j][k].pageZ = k;
                    
                    // Add the small cubes to their container.
                    rubiksPage[i][j][k].add(cubeMesh[i][j][k]);
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
     * Create history and rotate.
     */
    function rotatePageHistory(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, cb, i) {
        var element = {
            'pageRotation': true,
            'x': x,
            'y': y,
            'z': z,
            'xStatic': xStatic,
            'yStatic': yStatic,
            'zStatic': zStatic,
            'xDirection': xDirection,
            'yDirection': yDirection,
            'zDirection': zDirection
        };
        
        if (isHistory) {
            !history || history.addElement(element);
        }
        
        rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, cb, i);
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
     * @param Function cb Call back
     * @param Integer i Recursive variable
     */
    function rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection, cb, i) {
        // Play sound, if it is not shuffle.
        // Mobile devices can't handle so much requests.
        var isPlay = (fancy3D() ? localStorage.getItem('rubikMusic') : false);
        isPlay = (isPlay === 'true' || isPlay === null);
        if (isPlay) {
            sound = new Howl({
                urls: ['sounds/scratch.mp3'],
                autoplay: true,
                loop: false,
                volume: soundVolume,
                onend: function() {
                    //
                }
            });
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
        
        var rotateSteps = (fancy3D() ? 8 : (Detector.webgl ? 8 : (isAnimation ? 3 : 2)));
        var rotAngleDiff = 0;
        var rotAndleDelta = rotAngle / rotateSteps;
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
                        rotateAroundWorldAxis(rubiksPage[xi][yi][zi], axisLocal, rotAndleDelta);
                    }
                }
                
                setTimeout(function () {moveCubes()}, (fancy3D() ? 15 : 20));
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
                    // Done.
                    
                    if (isScoreboard && isTimer && isTimerShow && isCubeSolved()) {
                        scoreboard.stopTimer();
                        setTopScore(scoreboard.getTime());
                    }
                    
                    setForwarBackVisibility();
                    
                    gameState = gameStates.playing;
                }
            }
        }
    }
    
    /**
     * Set Top Score
     */
    function setTopScore(score) {
        if (score && (!topScore || topScore > score)) {
            topScore = score;
            localStorage.setItem("rubikTopScore", topScore);
            
            if (isScoreboard) {
                scoreboard.message(gameName + '<br />Top Score: ' + parseInt(score) + 'sec');
            }
        }
    }
    
    /**
     * Checking if the cube is solved.
     */
    function isCubeSolved() {
        var solved = true;
        
        // X axis
        // The idea is checking X, Y and Z parameter. If any of the is the same on the page, than that page is solved.
        for (var i = -1; i <= 1; i++) {
            var pX = pY = pZ = null;
            var isSameX = isSameY = isSameZ = true;
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    if (pX === null) {
                        pX = rubiksPage[i][j][k].pageX;
                    }
                    else {
                        isSameX = (pX == rubiksPage[i][j][k].pageX ? isSameX : false);
                    }
                    if (pY === null) {
                        pY = rubiksPage[i][j][k].pageY;
                    }
                    else {
                        isSameY = (pY == rubiksPage[i][j][k].pageY ? isSameY : false);
                    }
                    if (pZ === null) {
                        pZ = rubiksPage[i][j][k].pageZ;
                    }
                    else {
                        isSameZ = (pZ == rubiksPage[i][j][k].pageZ ? isSameZ : false);
                    }
                }
            }
            
            // A page is solved, if the color (original position) is the same.
            solved = solved && (isSameX || isSameY || isSameZ);
        }
        
        // Y axis
        for (var i = -1; i <= 1; i++) {
            var pX = pY = pZ = null;
            var isSameX = isSameY = isSameZ = true;
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    if (pX === null) {
                        pX = rubiksPage[j][i][k].pageX;
                    }
                    else {
                        isSameX = (pX == rubiksPage[j][i][k].pageX ? isSameX : false);
                    }
                    if (pY === null) {
                        pY = rubiksPage[j][i][k].pageY;
                    }
                    else {
                        isSameY = (pY == rubiksPage[j][i][k].pageY ? isSameY : false);
                    }
                    if (pZ === null) {
                        pZ = rubiksPage[j][i][k].pageZ;
                    }
                    else {
                        isSameZ = (pZ == rubiksPage[j][i][k].pageZ ? isSameZ : false);
                    }
                }
            }
            
            solved = solved && (isSameX || isSameY || isSameZ);
        }
        
        // Z axis
        // We don't have to check Z axis after X and Y, but the check is much simmetrical with Z.
        for (var i = -1; i <= 1; i++) {
            var pX = pY = pZ = null;
            var isSameX = isSameY = isSameZ = true;
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    if (pX === null) {
                        pX = rubiksPage[j][k][i].pageX;
                    }
                    else {
                        isSameX = (pX == rubiksPage[j][k][i].pageX ? isSameX : false);
                    }
                    if (pY === null) {
                        pY = rubiksPage[j][k][i].pageY;
                    }
                    else {
                        isSameY = (pY == rubiksPage[j][k][i].pageY ? isSameY : false);
                    }
                    if (pZ === null) {
                        pZ = rubiksPage[j][k][i].pageZ;
                    }
                    else {
                        isSameZ = (pZ == rubiksPage[j][k][i].pageZ ? isSameZ : false);
                    }
                }
            }
            
            solved = solved && (isSameX || isSameY || isSameZ);
        }
        
        return solved;
    }
    
    /**
     * Move middle X cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of X page.
     */
    function moveMiddleX(direction, i) {
        var tmp = rubiksPage[i][0][1];
        if (direction > 0) {
            rubiksPage[i][0][1] = rubiksPage[i][-1][0];
            rubiksPage[i][-1][0] = rubiksPage[i][0][-1];
            rubiksPage[i][0][-1] = rubiksPage[i][1][0];
            rubiksPage[i][1][0] = tmp;
        }
        else {
            rubiksPage[i][0][1] = rubiksPage[i][1][0];
            rubiksPage[i][1][0] = rubiksPage[i][0][-1];
            rubiksPage[i][0][-1] = rubiksPage[i][-1][0];
            rubiksPage[i][-1][0] = tmp;
        }
    }
    
    /**
     * Move middle Y cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Y page.
     */
    function moveMiddleY(direction, i) {
        var tmp = rubiksPage[0][i][1];
        if (direction > 0) {
            rubiksPage[0][i][1] = rubiksPage[-1][i][0];
            rubiksPage[-1][i][0] = rubiksPage[0][i][-1];
            rubiksPage[0][i][-1] = rubiksPage[1][i][0];
            rubiksPage[1][i][0] = tmp;
        }
        else {
            rubiksPage[0][i][1] = rubiksPage[1][i][0];
            rubiksPage[1][i][0] = rubiksPage[0][i][-1];
            rubiksPage[0][i][-1] = rubiksPage[-1][i][0];
            rubiksPage[-1][i][0] = tmp;
        }
    }
    
    /**
     * Move middle Z cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Z page.
     */
    function moveMiddleZ(direction, i) {
        var tmp = rubiksPage[0][1][i];
        if (direction > 0) {
            rubiksPage[0][1][i] = rubiksPage[-1][0][i];
            rubiksPage[-1][0][i] = rubiksPage[0][-1][i];
            rubiksPage[0][-1][i] = rubiksPage[1][0][i];
            rubiksPage[1][0][i] = tmp;
        }
        else {
            rubiksPage[0][1][i] = rubiksPage[1][0][i];
            rubiksPage[1][0][i] = rubiksPage[0][-1][i];
            rubiksPage[0][-1][i] = rubiksPage[-1][0][i];
            rubiksPage[-1][0][i] = tmp;
        }
    }
    
    /**
     * Move corner X cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of X page.
     */
    function moveCornerX(direction, i) {
        var tmp = rubiksPage[i][1][1];
        if (direction > 0) {
            rubiksPage[i][1][1] = rubiksPage[i][-1][1];
            rubiksPage[i][-1][1] = rubiksPage[i][-1][-1];
            rubiksPage[i][-1][-1] = rubiksPage[i][1][-1];
            rubiksPage[i][1][-1] = tmp;
        }
        else {
            rubiksPage[i][1][1] = rubiksPage[i][1][-1];
            rubiksPage[i][1][-1] = rubiksPage[i][-1][-1];
            rubiksPage[i][-1][-1] = rubiksPage[i][-1][1];
            rubiksPage[i][-1][1] = tmp;
        }
    }
    
    /**
     * Move corner Y cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Y page.
     */
    function moveCornerY(direction, i) {
        var tmp = rubiksPage[1][i][1];
        if (direction > 0) {
            rubiksPage[1][i][1] = rubiksPage[-1][i][1];
            rubiksPage[-1][i][1] = rubiksPage[-1][i][-1];
            rubiksPage[-1][i][-1] = rubiksPage[1][i][-1];
            rubiksPage[1][i][-1] = tmp;
        }
        else {
            rubiksPage[1][i][1] = rubiksPage[1][i][-1];
            rubiksPage[1][i][-1] = rubiksPage[-1][i][-1];
            rubiksPage[-1][i][-1] = rubiksPage[-1][i][1];
            rubiksPage[-1][i][1] = tmp;
        }
    }
    
    /**
     * Move corner Z cubes.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Z page.
     */
    function moveCornerZ(direction, i) {
        var tmp = rubiksPage[1][1][i];
        if (direction > 0) {
            rubiksPage[1][1][i] = rubiksPage[-1][1][i];
            rubiksPage[-1][1][i] = rubiksPage[-1][-1][i];
            rubiksPage[-1][-1][i] = rubiksPage[1][-1][i];
            rubiksPage[1][-1][i] = tmp;
        }
        else {
            rubiksPage[1][1][i] = rubiksPage[1][-1][i];
            rubiksPage[1][-1][i] = rubiksPage[-1][-1][i];
            rubiksPage[-1][-1][i] = rubiksPage[-1][1][i];
            rubiksPage[-1][1][i] = tmp;
        }
    }
    
    /**
     * Move X page.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of X page.
     */
    function movePageX(direction, i) {
      moveCornerX(direction, i);
      moveMiddleX(direction, i);
    }
    
    /**
     * Move Y page.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Y page.
     */
    function movePageY(direction, i) {
      moveCornerY(direction, i);
      moveMiddleY(direction, i);
    }
    
    /**
     * Move Z page.
     * 
     * @param Boolean direction
     * @param Integer i
     *   Number of Z page.
     */
    function movePageZ(direction, i) {
      moveCornerZ(direction, i);
      moveMiddleZ(direction, i);
    }
    
    /**
     * Move cube with X pages.
     * 
     * @param Boolean direction
     */
    function movePageXAll(direction) {
        for (var i = -1; i <= 1; i++) {
            movePageX(direction, i);
        }
    }
    
    /**
     * Move cube with Y pages.
     * 
     * @param Boolean direction
     */
    function movePageYAll(direction) {
        for (var i = -1; i <= 1; i++) {
            movePageY(direction, i);
        }
    }
    
    /**
     * Move cube with Z pages.
     * 
     * @param Boolean direction
     */
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
        
        if (fancy3D()) {
            var time = Date.now() * 0.00005;
            //h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
            //material.color.setHSL( h, 0.5, 0.5 );
            
            //var alpha = h * 2 * Math.PI;
            //particles.position.x = 100 * Math.sin(alpha);
            //particles.position.y = 100 * Math.cos(alpha);
            //particles.position.z = 100 * Math.sin(alpha);
            particles.rotation.y = time / 10;
        }
        
        if (Detector.webgl) {
            renderer.autoClear = false;
            renderer.clear();
            renderer.render(bgScene, bgCam);
        }
        
        renderer.render(scene, camera);
    }
    
    /**
     * Mouse events.
     */
    
    /**
     * Mouse down.
     */
    function onDocumentMouseDown( event ) {
        event.preventDefault();
        
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        pointerDown(mouseX, mouseY);
    }
    
    /**
     * Mouse move.
     */
    function onDocumentMouseMove( event ) {
        event.preventDefault();
        
        pointerMove();
    }
    
    /**
     * Mouse up.
     */
    function onDocumentMouseUp( event ) {
        event.preventDefault();
        
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        pointerUp(mouseX, mouseY);
    }
    
    /**
     * Mouse out.
     */
    function onDocumentMouseOut( event ) {
        pointerOut();
    }
    
    /**
     * Touch start.
     */
    function onDocumentTouchStart( event ) {
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            
            mouseX = event.touches[ 0 ].pageX;
            mouseY = event.touches[ 0 ].pageY;
            
            touches = event.touches;
            
            pointerDown(mouseX, mouseY);
        }
    }
    
    /**
     * Touch move.
     */
    function onDocumentTouchMove( event ) {
        event.preventDefault();
        
        pointerMove();
        
        touches = event.touches;
    }
    
    /**
     * Touch end.
     */
    function onDocumentTouchEnd( event ) {
        if ( touches && touches.length === 1 ) {
            event.preventDefault();
            
            mouseX = touches[ 0 ].pageX;
            mouseY = touches[ 0 ].pageY;
            
            pointerUp(mouseX, mouseY);
        }
    }
    
    /**
     * Touch enter.
     */
    function onDocumentTouchEnter( event ) {
    }
    
    /**
     * Touch leave.
     */
    function onDocumentTouchLeave( event ) {
        pointerOut();
    }
    
    /**
     * Touch cancel.
     */
    function onDocumentTouchCancel( event ) {
        pointerOut();
    }
    
    /**
     * Mouse or touch move.
     */
    function pointerMove() {
    }
    
    /**
     * Mouse or touch out.
     */
    function pointerOut() {
        mouseState = mouseStates.released;
    }
    
    /**
     * Mouse or touch down.
     */
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
    
    /**
     * Mouse or touch up.
     */
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
                
                rotatePageHistory(
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
                    rotatePageHistory(
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
            // Mouse delta should be enough big, and only in one direction.
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
                    
                    var element = {
                            'pageRotation': false,
                            'xRotate': true,
                            'yRotate': false,
                            'zRotate': false,
                            'xStatic': xStatic,
                            'yStatic': yStatic,
                            'zStatic': zStatic,
                            'xDirection': xDirection,
                            'yDirection': yDirection,
                            'zDirection': zDirection
                        };
                    
                    if (isHistory) {
                        !history || history.addElement(element);
                    }
                    
                    for (var x = -1; x <= 1; x++) {
                        rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection);
                    }
                }
                else if ('y' == axis) {
                    yStatic = true;
                    // There are different rotation on the top and on the bottom of cube.
                    //yDirection = ((mouseXDelta >= 0 && mY >= -windowHalfY * 0.8) || (mouseXDelta < 0 && mY < -windowHalfY * 0.8));
                    yDirection = (mouseXDelta >= 0);
                    
                    var element = {
                            'pageRotation': false,
                            'xRotate': false,
                            'yRotate': true,
                            'zRotate': false,
                            'xStatic': xStatic,
                            'yStatic': yStatic,
                            'zStatic': zStatic,
                            'xDirection': xDirection,
                            'yDirection': yDirection,
                            'zDirection': zDirection
                        };
                    if (isHistory) {
                        !history || history.addElement(element);
                    }
                    
                    for (var y = -1; y <= 1; y++) {
                        rotatePage(x, y, z, xStatic, yStatic, zStatic, xDirection, yDirection, zDirection);
                    }
                }
                else if ('z' == axis) {
                    zStatic = true;
                    zDirection = (mouseYDelta >= 0);
                    
                    var element = {
                            'pageRotation': false,
                            'xRotate': false,
                            'yRotate': false,
                            'zRotate': true,
                            'xStatic': xStatic,
                            'yStatic': yStatic,
                            'zStatic': zStatic,
                            'xDirection': xDirection,
                            'yDirection': yDirection,
                            'zDirection': zDirection
                        };
                    if (isHistory) {
                        !history || history.addElement(element);
                    }
                    
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
     * 
     * @param Integer eventX
     *     Mouse or touch X
     * @param Integer eventY
     *     Mouse or touch Y
     * @param Boolean isCube
     *     Is cube or page check?
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
                    rubiksPage[i][1][j].children[0].cubeX = i;
                    rubiksPage[i][1][j].children[0].cubeY = 1;
                    rubiksPage[i][1][j].children[0].cubeZ = j;
                    
                    children.push(rubiksPage[i][1][j].children[0]);
                }
            }
            // Left.
            // Don't add top again.
            for (var i = -1; i <= 0; i++) {
                for (var j = -1; j <= 1; j++) {
                    rubiksPage[-1][i][j].children[0].cubeX = -1;
                    rubiksPage[-1][i][j].children[0].cubeY = i;
                    rubiksPage[-1][i][j].children[0].cubeZ = j;
                    
                    children.push(rubiksPage[-1][i][j].children[0]);
                }
            }
            // Right.
            // Don't add top and left again.
            for (var i = 0; i <= 1; i++) {
                for (var j = -1; j <= 0; j++) {
                    rubiksPage[i][j][1].children[0].cubeX = i;
                    rubiksPage[i][j][1].children[0].cubeY = j;
                    rubiksPage[i][j][1].children[0].cubeZ = 1;
                    
                    children.push(rubiksPage[i][j][1].children[0]);
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
    
    /**
     * Gives back a boolean about.
     * True, if it is a touch device.
     * False otherwise.
     * 
     * @return Boolean
     */
    function is_touch_device() {
        return !!('ontouchstart' in window);
    }
    
    /**
     * Window resize event.
     */
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        xBiggerY = (windowHalfX > windowHalfY);
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize( window.innerWidth, window.innerHeight );
        
        initializeMenu();
    }
    
    
    // Writing out some basic texts.
    var writeTextContainer;
    /**
     * Write text.
     * 
     * @param String text
     */
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
    /**
     * Remove text.
     */
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
        
        // Preloader anymation.
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
        
        // Preload all the images.
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
        imageObj['gray'] = new Image();
        imageObj['gray'].src = 'pics/gray3.png';
        imageObj['whitespil'] = new Image();
        imageObj['whitespil'].src = 'pics/whitespil.jpg';
        imageObj['solve'] = new Image();
        imageObj['solve'].src = 'pics/solve.png';
        imageObj['shuffle'] = new Image();
        imageObj['shuffle'].src = 'pics/shuffle.png';
        imageObj['disc'] = new Image();
        imageObj['disc'].src = 'pics/disc.png';
        imageObj['forward'] = new Image();
        imageObj['forward'].src = 'pics/forward.jpg';
        imageObj['back'] = new Image();
        imageObj['back'].src = 'pics/back.jpg';
        imageObj['rotate'] = new Image();
        imageObj['rotate'].src = 'pics/rotate.jpg';
        imageObj['music'] = new Image();
        imageObj['music'].src = 'pics/music.jpg';
        imageObj['background'] = new Image();
        imageObj['background'].src = 'pics/galaxysmall.jpg';
    }
    preloadResources();
    
    window.addEventListener('load', booting, false);
})();
