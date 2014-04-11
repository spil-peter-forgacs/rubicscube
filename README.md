Rubik's Cube game
==========

Usage of game
-------------
Shuffle the cube with the shuffle button.
Then you can move the pages touching the cube and moving to the right direction.
You can move the cube too, if you wipe the screen outside of the cube (bottom, left, right).
If you want to restart, click to the solve button.
This game also has an undo and a redo button.
You can also mute and unmute the sounds and music.
Using the rotate button you can make a short glimpse of the other side of the cube.

Technology
----------

Libraries:
* Three JS (for making webGL easy)
  http://github.com/mrdoob/three.js
* Detector JS (detecting webGL)
  @author alteredq / http://alteredqualia.com/
  @author mr.doob / http://mrdoob.com/
* Howler JS (for sound and music)
  howlerjs.com
  (c) 2013-2014, James Simpson of GoldFire Studios
  goldfirestudios.com
  MIT License
* Scoreboard JS (messaging, scroing and timing)
  https://github.com/eee-c/scoreboard.js
  @author Chris Strom
  MIT License
  This library is related to the book "3D Game Programming for Kids".
  This book easily explain all the webGL/Three JS fundamentals.
  I can suggest to you to read it, if you are a newby in programming 3D word.
* History JS (for storing the movement histories)
  @author Peter Forgacs

This game uses webGL and Three JS.
Canvas is fallback, but not supported.

It is tested and works fine with PC (Windows), Mac and Android where webGL is supported.
Also it works fine with Chrome, Firefox and Opera browsers.
It uses canvas fallback with Safari and iOS. In this case the geometry is ugly and the performance is low.
  A few features were disabled when the code runs on these devices and browsers.

Game logic
----------
* The game uses the rubiksCube 3D object, as a main container of cube.
* The rubiksPage is an array. Contains objects, that are virtual objects containing the small cubes.
  They are always on same positions. Used by calculating the clicked objects.
* The cubeMesh is an array. Contains objects of the small cubes.
* The three cubePage is an array. They contains objects, that are used for catching the clicks.
  They are front of the three visible cube pages.

Possible future developments
* Help to solve the cube
* Solve button and logic
* Be more social
* Play / competing together
* Challenges and levels
* Compile the code

Sound
-----
Freesound.

Pictures
--------
Mostly self made and GPL.

Music
-----
"Pamgaea" Kevin MacLeod (incompetech.com)

Licensed under Creative Commons: By Attribution 3.0

http://creativecommons.org/licenses/by/3.0/

Developer
---------
Peter Forgacs, Spilgames

Enjoy the game.
