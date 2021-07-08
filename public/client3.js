import * as THREE from '../build/three.module.js';
 
import { VRButton } from './jsm/webxr/VRButton.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
import TeleportVR from './jsm/teleportvr.js';
import FlyingVR from './jsm/flyingvr.js';
import TPointsvr from './jsm/TPointsvr.js';
import { XRControllerModelFactory } from './jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { PLYLoader } from '/jsm/loaders/PLYLoader.js'
import { OBJLoader } from './jsm/loaders/OBJLoader.js';

 
 
import { CanvasUI } from './jsm/CanvasUI.js'
//import FlyingVR from 'three/examples/jsm/flyingvr';
import { TeleportMesh } from './jsm/TeleportMesh.js'


let boxh = new THREE.BoxHelper();


const box = new THREE.Box3();
const clock = new THREE.Clock();
let maxDist = 10;
let container;
let camera, scene, raycaster, renderer, dolly;

let blinkSpheres = [];
let mode = "blur";
let dt;

var Target = new THREE.Vector3();
var blinkerSphereMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,

    color: 0xADADA8,
    transparent: true,
    opacity: 0.9
    //  colorWrite: false
});

let R = [0, 0.75, 0.85, 1]
let blinkSphersN = [];
for (var i = 0; i <= 4; i += 1) {

    var tempSphereGeometry = new THREE.SphereBufferGeometry(0.9, 64, 8, 0, Math.PI * 2, 0, Math.PI * R[i]);

    tempSphereGeometry.translate(0, 0.3, 0);

    var tempSphere = new THREE.Mesh(
        tempSphereGeometry, blinkerSphereMaterial
    );
    tempSphere.rotation.set(Math.PI / 2, 0, 0);
    tempSphere.position.set(0, 1.6, 2.5);
    tempSphere.visible = false;

    blinkSphersN.push(tempSphere);
}
let radiusIndex;
const locations = [
    new THREE.Vector3(6, 0, -5),
    new THREE.Vector3(20, 0, -3),
    new THREE.Vector3(20, 0, -7),
    new THREE.Vector3(20, 0, 1),
    // new THREE.Vector3(5, 0, 5),
    // new THREE.Vector3(0, 0, 5),
    // new THREE.Vector3(-6.644, 0, -4.114)
];
let coustomMaxDistance;
let coustomTeleportSpeed;
let selected = false;
let coustomSpeed;
let coustomForwordDirection;
let coustomTriggerMovement;

let pressed = false;
let dummyCam;
let colliders;
let colliders2;
let colliders3;
let colliders4;



let teleports = [];
let cameraWorldRotaion = new THREE.Quaternion();

/// scene variables 
var bbox;
var bboxSize;
var bboxLength;

var testr = new THREE.Quaternion();;

var testRotation = new THREE.Quaternion();

let ui;
const map_api = { Map: 'St de Pedret' };
const api = {
    Mode: 'blur',
    Radius: 2
};

let methods = {
    TeleportMode: true,
    flyMode: false,
    TeleportaionPoints: false
}
var StPedret;
var model2;
var model3;
var model4;

let teleportVR;
let flyingVR;
let tPointsVR;

let workingMatrix = new THREE.Matrix4();


let controller, controllerGrip;
let controller1, controllerGrip1;

var freeflying = false;;
let settings;

init();


setupXR();
animate();

let object;
function init() {

    container = document.createElement('div');
    document.body.appendChild(container);


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);


    dolly = new THREE.Group();
    //dolly.position.z =2;
    dolly.add(camera);
    //dolly.add(  controller );

    scene.add(dolly);
    for (var i = 0; i <= 4; i++) {
        dolly.children[0].attach(blinkSphersN[i]);

    }
    // ground
    const ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    ground.rotation.x = - Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    var grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    //scene.add(grid);
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshPhongMaterial({ color: 0x1ABB22 });
    // material.colorWrite   =  false;
    //material.renderOrder=-103
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));

    colliders = [];
    colliders2 = [];
    colliders3 = [];
    colliders4 = [];

    for (let x = -100; x < 100; x += 20) {
        for (let z = -100; z < 100; z += 20) {
            if (x == 0 && z == 0) continue;
            const box = new THREE.Mesh(geometry, material);
            box.position.set(x, 2.5, z);

            const edge = line.clone();
            edge.position.copy(box.position);
            //scene.add(box);
            //scene.add(edge);
            //colliders.push(box);
        }
    }

    locations.forEach(myFunction);

    function myFunction(item, index) {
        const teleport = new TeleportMesh();
        teleport.position.copy(item);
        scene.add(teleport);
        teleports.push(teleport);

    }

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);




    const light1 = new THREE.PointLight(0xffffff, 1, 30);
    light1.position.set(1, 3, 4);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 1, 30);
    light2.position.set(5, 3, -10);
    scene.add(light2);


    const light3 = new THREE.PointLight(0xffffff, 1, 30);
    light3.position.set(0, 3, -50);
    scene.add(light3);
    ////////////////////////
    const loader_gltf = new GLTFLoader();



    // Load a glTF resource
    loader_gltf.load(
        // resource URL
        './jsm/model2/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {

                    // child.material.map = texture;


                    colliders2.push(child);
                }

            });
            model2 = gltf.scene.children[0];;
            model2.scale.set(.05, .05, .05);
            model2.position.set(-9, -23, -30);
            //scene.add(model2);
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

        },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );
    ///////////////////////////////////

    const loader_gltf2 = new GLTFLoader();



    // Load a glTF resource
    loader_gltf2.load(
        // resource URL
        './jsm/model3/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {

                    // child.material.map = texture;


                    colliders4.push(child);
                }

            });
            model4 = gltf.scene.children[0];;
            model4.scale.set(2, 2, 2);
            model4.position.set(-10, 0, 0);
            //scene.add(model2);
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

        },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );

    ///////////////////////////////////////////////
    const loader_gltf3 = new GLTFLoader();



    // Load a glTF resource
    loader_gltf3.load(
        // resource URL
        './jsm/model6/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {

                    // child.material.map = texture;


                    colliders3.push(child);
                }

            });
            model3 = gltf.scene.children[0];;
            model3.scale.set(.2, .2, .2);
            model3.position.set(35, -30, 11);
            //scene.add(model2);
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

        },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );
    // function loadModel() {

    //     // object.traverse(function (child) {
    //     //     //      console.log(child);
    //     //     ///
    //     //     if (child.isMesh) {

    //     //         child.material.map = texture;
    //     //         if (child.name.indexOf("Cube") != -1) {
    //     //             //                     //child.material.visible = false;
    //     //             //colliders.push(child);
    //     //         }
    //     //     }
    //     // });

    //     object.position.y = .5;
    //        object.rotation.y = - Math.PI / 2;
    //        scene.add(object);

    // }

    // const manager = new THREE.LoadingManager(loadModel);

    // manager.onProgress = function (item, loaded, total) {

    //     //  console.log(item, loaded, total);

    // };

    // texture

    // const textureLoader = new THREE.TextureLoader(manager);
    // const texture = textureLoader.load('./jsm/textures/untitled11.png');
    // // StBartsTheLess02
    // // model

    // function onProgress(xhr) {

    //     if (xhr.lengthComputable) {

    //         const percentComplete = xhr.loaded / xhr.total * 100;
    //         console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');

    //     }

    // }

    function onError() { }

    // const loader = new OBJLoader(manager);
    // loader.load('./jsm/model/untitled.obj', function (obj) {

    //     object = obj;
    //     //  console.log(colliders);
    // }, onProgress, onError);



    //const textureLoader1 = new THREE.TextureLoader();
    // const plyMaterial =       new THREE.MeshBasicMaterial({map: textureLoader1.load() }) ;



    var texture1 = new THREE.TextureLoader().load('./jsm/model7/pedret-interior_meshed_tex.png');
    var material1 = new THREE.MeshStandardMaterial({ map: texture1, flatShading: true });

    const loader1 = new PLYLoader();

    loader1.load(
        './jsm/model7/pedret-interior_meshed_simplified.ply',





        function (geometry) {

            // geometry.traverse( function ( child ) {
            //     if ( child instanceof THREE.Object3D  ) {

            //     }
            // });

            geometry.computeVertexNormals();
            StPedret = new THREE.Mesh(geometry, material1)
            StPedret.rotateX(-Math.PI / 2)
            StPedret.position.set(-1.5, 1.1, -2);
            StPedret.traverse(function (child) {

                //     StPedret.geometry.computeBoundingBox();
                // box.copy( StPedret.geometry.boundingBox ).applyMatrix4( StPedret.matrixWorld );
                //   boxh = new THREE.BoxHelper( StPedret, 0xffff00 );
                //   scene.add( boxh );
                if (child.isMesh) {

                    // child.material.map = texture;

                    colliders.push(child);


                }
            });


        },



        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            console.log(error);
        }
    );
    console.log(colliders);

    //
    //mesh.geometry.computeBoundingBox();

    //...

    // in the animation loop, compute the current bounding box with the world matrix
    // box.copy( mesh.geometry.boundingBox ) 


    window.addEventListener('resize', onWindowResize, false);


    createPanel();
}


function setupXR() {
    renderer.xr.enabled = true;



    const controllerModelFactory = new XRControllerModelFactory();

    // controller
    controller = renderer.xr.getController(0);
    controllerGrip = renderer.xr.getControllerGrip(0);
    controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
    //controller.add( controllerGrip );

    controllerGrip.addEventListener("connected", (e) => {
        controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
        teleportVR.add(0, controllerGrip, e.data.gamepad);
        flyingVR.add(0, controllerGrip, e.data.gamepad);
        tPointsVR.add(0, controllerGrip, e.data.gamepad);
    });
    //scene.add( controller );
    // controller1
    controller1 = renderer.xr.getController(1);

    controllerGrip1 = renderer.xr.getControllerGrip(1);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));


    controllerGrip1.addEventListener("connected", (e) => {
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        teleportVR.add(1, controllerGrip1, e.data.gamepad);
        flyingVR.add(1, controllerGrip1, e.data.gamepad);
        tPointsVR.add(1, controllerGrip1, e.data.gamepad);

    });
    //scene.add( controller1 );
    //
    dolly.add(controllerGrip);
    dolly.add(controller);
    dolly.add(controllerGrip1);
    dolly.add(controller1);

    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    controller.addEventListener('squeezestart', onSqueezeStart);
    controller.addEventListener('squeezeend', onSqueezeEnd);

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 10;

    const line2 = new THREE.Line(geometry);
    line2.name = 'line2';
    line2.scale.z = 10;

    controller.add(line);
    controller1.add(line2);

    dummyCam = new THREE.Object3D();
    camera.add(dummyCam);
    createUI();
    ui.mesh.position.set(0, 1.5, 1.5);
    ui.mesh.material.depthWrite = false;
    ui.mesh.material.depthTest = false;
    ui.mesh.material.opacity = .93;

    //scene.add( ui.mesh );
    camera.attach(ui.mesh);
    flyingVR = new FlyingVR(scene, dolly, "blur");
    teleportVR = new TeleportVR(scene, dolly, "blur");
    tPointsVR = new TPointsvr(scene, dolly, "blur");

    teleportVR.setcolliders(colliders);
    flyingVR.setcolliders(colliders);
    tPointsVR.setTPoints(teleports);


    function onSelectStart(event) {
        pressed = true;

        if (methods.TeleportaionPoints && ui.mesh.visible == false) {
            teleports.forEach(myFunction1);

            function myFunction1(item, index) {
                item.fadeIn(1);
                // console.log("ss");
            }

        }




    }

    function onSelectEnd() {

        pressed = false;

        if (methods.TeleportMode && ui.mesh.visible == false) {
            teleportVR.update();


        }
        if (methods.flyMode && ui.mesh.visible == false) {
            flyingVR.setPressed(pressed);
            flyingVR.setDeltaTime(0);
            flyingVR.update();
        }
        if (methods.TeleportaionPoints && ui.mesh.visible == false) {

            useTeleportPoint();
            teleports.forEach(myFunction1);

            function myFunction1(item, index) {
                item.fadeOut(1);
                // console.log("ss");
            }

        }
    }
    function onSqueezeStart() {

        ui.mesh.position.set(0, 0, -1.5);
        console.log(ui.mesh.position);
        ui.mesh.visible = true;

        line.visible = true;
        line2.visible = true;

    }

    function onSqueezeEnd() {

        ui.mesh.position.set(0, 1.5, -111.5);
        ui.mesh.visible = false;
        if (!methods.TeleportaionPoints) {
            line.visible = false;
            line2.visible = false;
        }

    }

    document.body.appendChild(VRButton.createButton(renderer));
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    renderer.setAnimationLoop(render);

}

function checkCollision() {



    workingMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(workingMatrix);



    const intersects = raycaster.intersectObjects(teleports);


    if (intersects.length > 0) {

        const intersect = intersects[0];
        // console.log(intersect);
        if (intersect.object instanceof TeleportMesh) {
            intersect.object.selected = true;
            selected = true;
            Target.copy(intersect.object.position);
        }
    }

}
function useTeleportPoint() {
    //sconsole.log(selected);
    if (!pressed && selected) {

        var R = radiusIndex;
        R = 1;
        if (mode == "blur") {


            //dist = temp.length();


            blinkSphersN[R].visible = true;
            blinkSphersN[R].scale.set(2, 2, 2);
            new TWEEN.Tween(blinkSphersN[R].scale)
                .to({ x: 4, y: 4, z: 4 }, 600)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
            new TWEEN.Tween(dolly.position)
                .to({ x: Target.x, y: Target.y, z: Target.z }, 900).start()
                .chain(
                    new TWEEN.Tween(blinkSphersN[R].scale)
                        .to({ x: 1, y: 1, z: 1 }, 400)
                        .onComplete(() => blinkSphersN[R].visible = false)).start();
            selected = false;

        }

        if (mode == "blink") {

            blinkSphersN[R].material.transparent = false;
            blinkSpheres[R].visible = true;
            blinkSpheres[R].material.opacity = 0;
            blinkSpheres[R].material.color.setHex(0x000000)
            blinkSpheres[R].scale.set(2, 2, 2);

            // console.log("ddd22d");
            new TWEEN.Tween(blinkSpheres[R].material)
                .to({ opacity: 1 }, 500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(function () {

                    // Do the teleport
                    Target.getWorldPosition(dolly.position);
                    Target.getWorldQuaternion(dolly.quaternion);

                    // Fade back
                    new TWEEN.Tween(blinkSpheres[R].material)
                        .to({ opacity: 0 }, 500)
                        .onComplete(() => blinkSpheres[R].visible = false)
                        .start();
                })
                .start();

        }

    }
}


function render() {
    flyingVR.update(dt);
    TWEEN.update();
    ui.update();
    dt = clock.getDelta();
    tPointsVR.update();

    teleports.forEach(teleport => {
        teleport.selected = false;
        teleport.update();
    });
    if (pressed && methods.flyMode && ui.mesh.visible == false) {
        flyingVR.setPressed(pressed);


    }

    if (pressed && methods.TeleportMode && ui.mesh.visible == false) {
        //console.log("Dd");
        teleportVR.update();

    }
    if (pressed && methods.TeleportaionPoints && ui.mesh.visible == false) {
        //console.log("Dd");
        tPointsVR.setPressed(pressed);
        tPointsVR.update();
    }
    // if (!pressed && methods.TeleportaionPoints && ui.mesh.visible == false) {
    //     //console.log("Dd");
    //    tPointsVR.setPressed(pressed);
    //  //   tPointsVR.update();
    // }


    checkCollision();
    //useTeleportPoint();






    renderer.render(scene, camera);
}


function createUI() {



    const config = {
        panelSize: { width: 3, height: 2 },
        height: 556,

        info: { type: "text", position: { left: 6, top: 6 },fontSize: 21, width: 500, height: 58, backgroundColor: "#aaa", fontColor: "#000" },
        Flying: { type: "button", position: { top: 70, left: 10 }, fontSize: 18, width: 150, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onFlying },
        SpeedP: { type: "button", position: { top: 140, left: 10 }, fontSize: 25, width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onSpeed },
        SpeedM: { type: "button", position: { top: 140, left: 90 },  fontSize: 25,width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onSpeeds },
        FreeFly: { type: "button", position: { top: 210, left: 10 }, fontSize: 13, width: 150, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onFreeFlying },
        ModeBlur: { type: "button", position: { top: 280, left: 10 }, fontSize: 14, width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onBlur },
        ModeBlink: { type: "button", position: { top: 280, left: 90 }, fontSize:13, width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onBlink },


        Radius1: { type: "button", position: { top: 350, left: 60 }, fontSize: 13, width: 90, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: changeRadius1(0) },
        Radius2: { type: "button", position: { top: 350, left: 160 }, fontSize: 13, width: 90, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: changeRadius1(1) },
        Radius3: { type: "button", position: { top: 350, left: 260 },  fontSize: 13,width: 90, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: changeRadius1(2) },
        Radius4: { type: "button", position: { top: 350, left: 360 }, fontSize: 13, width: 90, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: changeRadius1(3) },

        Teleport: { type: "button", position: { top: 70, right: 180 },  fontSize: 18,width: 150, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onTeleport },
        MaxDistanceP: { type: "button", position: { top: 140, right: 260 },  fontSize: 25,width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onMaxDistanceP },
        MaxDistanceM: { type: "button", position: { top: 140, right: 180 },  fontSize: 25,width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onMaxDistanceM },
        ModeBlur1: { type: "button", position: { top: 210, right: 260 }, fontSize: 14, width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onBlur1 },
        ModeBlink1: { type: "button", position: { top: 210, right: 180 },  fontSize: 13,width: 70, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onBlink1 },

 
        TeleportionPoint: { type: "button", position: { top: 70, right: 10 }, fontSize: 20, width: 150, height: 52, fontColor: "#fff", backgroundColor: "#0022f3", hover: "#3df", onSelect: onTeleportaionPoints },
        renderer: renderer
    }
    const content = {
        info: "",
        Flying: "Flying",
        SpeedP: "+",
        SpeedM: "-",
        FreeFly: "Free Flying",
        ModeBlur: "Blur",
        ModeBlink: "Blink",
        ////////////////
        Teleport: "Teleportation",
        MaxDistanceP: "+",
        MaxDistanceM: "-",
        ModeBlur1: "Blur",
        ModeBlink1: "Blink",
        /////////////////
        Radius1: "Radius1",
        Radius2: "Radius2",
        Radius3: "Radius3",
        Radius4: "Radius4",
        ///////////////////////
        TeleportionPoint: "T-Points",
    }
    ui = new CanvasUI(content, config);
}

function onTeleport() {

    methods.TeleportMode = true;
    methods.flyMode = false;
    methods.TeleportaionPoints = false;
    ui.updateElement("info", "Using Teleportation metaphor");

}

function onFlying() {
    methods.flyMode = true;
    methods.TeleportMode = false;
    methods.TeleportaionPoints = false;
    ui.updateElement("info", "Using Flying metaphor");

}
function onTeleportaionPoints() {
    methods.TeleportaionPoints = true;
    methods.flyMode = false;
    methods.TeleportMode = false;
    ui.updateElement("info", "Using Teleportaion Points metaphor");

}
let speed = 3;
function onSpeed() {
    speed++;
    flyingVR.setspeed(speed);
    ui.updateElement("info", "Flying speed is " + speed);
}
function onSpeeds() {
    speed--;
    flyingVR.setspeed(speed);
    ui.updateElement("info", "Flying speed is " + speed);
}
let free = false;
function onFreeFlying() {

    free = !free;
    flyingVR.setAllowFlying(free);
    if (free)
        ui.updateElement("info", "Free Flying mode is on");
    if (!free)
        ui.updateElement("info", "Free Flying mode is off");
}
function onBlur() {

    flyingVR.setMode("blur");
    ui.updateElement("info", "Blur mode activated ");
}
function onBlink() {

    flyingVR.setMode("blink");
    ui.updateElement("info", "Blur mode activated ");
}
//////////////////

function onMaxDistanceP() {
    maxDist += 5;
    teleportVR.setMaxDistance(maxDist);
    ui.updateElement("info", "Max distance allowed is : " + maxDist);
}

function onMaxDistanceM() {
    maxDist -= 5;
    teleportVR.setMaxDistance(maxDist);
    ui.updateElement("info", "Max distance allowed is : " + maxDist);
}
function onBlur1() {

    teleportVR.setMode("blur");
    ui.updateElement("info", "Blur mode activated ");
}
function onBlink1() {

    teleportVR.setMode("blink");
    ui.updateElement("info", "Blur mode activated ");
}


function changeRadius1(index) {

    // if (methods.TeleportMode) {
    //     if (index == 0)
    //         teleportVR.setraduisIndex(0);
    //     if (index == 1)
    //         teleportVR.setraduisIndex(1);
    //     if (index == 2)
    //         teleportVR.setraduisIndex(2);
    //     if (index == 3)
    //         teleportVR.setraduisIndex(3);
    //     //console.log(index);
    // }
    // if (methods.flyMode) {
    //     if (index == 0)
    //         flyingVR.setraduisIndex(0);
    //     if (index == 0.75)
    //         flyingVR.setraduisIndex(1);
    //     if (index == .85)
    //         flyingVR.setraduisIndex(2);
    //     if (index == 1)
    //         flyingVR.setraduisIndex(3);

    // }
}

function createPanel() {

    const panel = new GUI({ width: 310 });

    const folder0 = panel.addFolder('Maps');
    const folder1 = panel.addFolder('Method');
    const folder2 = panel.addFolder('Teleportaion');
    const folder3 = panel.addFolder('Flying');
    const folder4 = panel.addFolder('Teleportation Points')

    settings = {
        'Use Teleportaion': true,
        'Use Flying': false,
        'Use teleportaion Points': false,
        'Max distance to teleport': 10.0,
        'Flying speed': 3.0,
        'Allow Free Flying': false,
        'Use coustom Functions': false,
        'Use coustom Functions': false,
        'Speed Function': "Enter new Speed ",
        'Forward Function': 'Enter new Forward Direction',
        'Trigger Function': 'Enter new triggering',
        'MaxDistance Function': 'Enter new MaxDistance',
        'Teleportation Delay Function': 'Enter new Teleportation delay'

    };
    var modes = ['blur', 'blink'];
    var Radiuses = ["0", "1", "2", "3"];
    var maps = ["St de Pedret", "Ollantaytambo", "The cave", "Art gallery"]


    const changemaps = folder0.add(map_api, 'Map').options(maps);
    changemaps.onChange(changemap);

    ///////////////////////////////////////////////////////////////////
    folder1.add(methods, 'TeleportMode').name("Use Teleportaion").listen().onChange(function () {
        setChecked("use Teleportaion");
        onTeleport();
    });
    folder1.add(methods, 'flyMode').name("Use Flying").listen().onChange(function () {
        setChecked("use Flying");
        onFlying();
    });
    folder1.add(methods, 'TeleportaionPoints').name("Use Teleportaion Points").listen().onChange(function () {
        setChecked("Use teleportaion Points");
        onTeleportaionPoints();
    });


    ///////////////////////////////

    folder2.add(settings, 'Max distance to teleport', 10, 40, 5).onChange(changeMaxDistance);

    const switchmode = folder2.add(api, 'Mode').options(modes);
    switchmode.onChange(changeMode);

    const switchmode2 = folder2.add(api, 'Radius').options(Radiuses);
    switchmode2.onChange(changeRadius);

    folder2.add(settings, 'Use coustom Functions').listen().onChange(CoustomFunctions2);

    coustomMaxDistance = folder2.add(settings, "MaxDistance Function").onFinishChange(function (value) {

        teleportVR.setNewMaxDistance(value);
    });


    coustomTeleportSpeed = folder2.add(settings, "Teleportation Delay Function").onFinishChange(function (value) {

        teleportVR.setNewTeleDelay(value);
    });


    //////////////////////////////////////////////////////
    folder3.add(settings, 'Allow Free Flying').listen().onChange(changeFreeFlying);

    folder3.add(settings, 'Flying speed', 1, 10, 1).onChange(changeFlyingspeed);

    const switchmode3 = folder3.add(api, 'Mode').options(modes);
    switchmode3.onChange(changeMode);



    const switchmode4 = folder3.add(api, 'Radius').options(Radiuses);
    switchmode4.onChange(changeRadius);


    folder3.add(settings, 'Use coustom Functions').listen().onChange(CoustomFunctions);

    coustomSpeed = folder3.add(settings, "Speed Function").onFinishChange(function (value) {

        flyingVR.setNewSpeed(value);
    });



    coustomForwordDirection = folder3.add(settings, "Forward Function").onFinishChange(function (value) {

        flyingVR.setNewForward(value);
    });



    coustomTriggerMovement = folder3.add(settings, "Trigger Function").onFinishChange(function (value) {

        flyingVR.setNewTrigger(value);
    });

    ///////////////////////////////////////////////////////////

    const switchmode5 = folder4.add(api, 'Mode').options(modes);
    switchmode5.onChange(changeMode);



    const switchmode6 = folder4.add(api, 'Radius').options(Radiuses);
    switchmode6.onChange(changeRadius);

    ////////////////////////////
    folder0.open();
    folder1.open();
    folder2.open();
    folder3.open();
    folder4.open();
    ///////////////////////////////////////////////////
    coustomMaxDistance.domElement.style.pointerEvnts = "none";
    coustomMaxDistance.domElement.style.opacity = .3;

    coustomTeleportSpeed.domElement.style.pointerEvnts = "none";
    coustomTeleportSpeed.domElement.style.opacity = .3;

    ///////////////////////////////////////////
    coustomSpeed.domElement.style.pointerEvnts = "none";
    coustomSpeed.domElement.style.opacity = .3;

    coustomForwordDirection.domElement.style.pointerEvnts = "none";
    coustomForwordDirection.domElement.style.opacity = .3;

    coustomTriggerMovement.domElement.style.pointerEvnts = "none";
    coustomTriggerMovement.domElement.style.opacity = .3;
}

function changemap(map) {


    switch (map) {

        case "St de Pedret": {

            scene.add(StPedret);

            scene.remove(model2);
            scene.remove(model3);
            scene.remove(model4);

            teleportVR.setcolliders(colliders);
            flyingVR.setcolliders(colliders);
        }
            break;
        case "Ollantaytambo": console.log(map);
            scene.add(model3);;

            scene.remove(StPedret);
            scene.remove(model4);
            scene.remove(model2);
            teleportVR.setcolliders(colliders3);
            flyingVR.setcolliders(colliders3);
            break;
        case "The cave": {

            scene.add(model2);;

            scene.remove(model3);
            scene.remove(model4);
            scene.remove(StPedret);
            teleportVR.setcolliders(colliders2);
            flyingVR.setcolliders(colliders2);

        }
            break;
        case "Art gallery":

            scene.add(model4);;

            scene.remove(StPedret);
            scene.remove(model2);
            scene.remove(model3);

            teleportVR.setcolliders(colliders4);
            flyingVR.setcolliders(colliders4);

            break;
    }
}



function changeMaxDistance(maxDistance) {
    maxDist = maxDistance;
    teleportVR.setMaxDistance(maxDistance);


}
function changeFlyingspeed(flyingspeed) {

    flyingVR.setspeed(flyingspeed);


}

function changeFreeFlying(freefly) {
    flyingVR.setAllowFlying(freefly);
}

function CoustomFunctions(C) {
    if (!C) {
        coustomSpeed.domElement.style.pointerEvnts = "none";
        coustomSpeed.domElement.style.opacity = .3;
        console.log(coustomSpeed);


        coustomForwordDirection.domElement.style.pointerEvnts = "none";
        coustomForwordDirection.domElement.style.opacity = .3;


        coustomTriggerMovement.domElement.style.pointerEvnts = "none";
        coustomTriggerMovement.domElement.style.opacity = .3;
        flyingVR.setCustom(false);
    }
    if (C) {
        coustomSpeed.domElement.style.pointerEvnts = "auto";
        coustomSpeed.domElement.style.opacity = 1;

        coustomForwordDirection.domElement.style.pointerEvnts = "auto";
        coustomForwordDirection.domElement.style.opacity = 1;

        coustomTriggerMovement.domElement.style.pointerEvnts = "auto";
        coustomTriggerMovement.domElement.style.opacity = 1;
        flyingVR.setCustom(true);

    }
}
function CoustomFunctions2(C) {
    if (!C) {
        coustomMaxDistance.domElement.style.pointerEvnts = "none";
        coustomMaxDistance.domElement.style.opacity = .3;

        coustomTeleportSpeed.domElement.style.pointerEvnts = "none";
        coustomTeleportSpeed.domElement.style.opacity = .3;



        teleportVR.setCustom(false);
    }
    if (C) {
        coustomMaxDistance.domElement.style.pointerEvnts = "auto";
        coustomMaxDistance.domElement.style.opacity = 1;

        coustomTeleportSpeed.domElement.style.pointerEvnts = "auto";
        coustomTeleportSpeed.domElement.style.opacity = 1;

        teleportVR.setCustom(true);

    }
}
function changeRadius(index) {

    if (methods.TeleportMode) {
        if (index == 0)
            teleportVR.setraduisIndex(0);
        if (index == 1)
            teleportVR.setraduisIndex(1);
        if (index == 2)
            teleportVR.setraduisIndex(2);
        if (index ==3)
            teleportVR.setraduisIndex(3);
        //console.log(index);
    }
    if (methods.flyMode) {
        if (index == 0)
            flyingVR.setraduisIndex(0);
        if (index == 1)
            flyingVR.setraduisIndex(1);
        if (index == 2)
            flyingVR.setraduisIndex(2);
        if (index == 3)
            flyingVR.setraduisIndex(3);

    }
    if (methods.TeleportaionPoints) {
        if (index == 0)
            tPointsVR.setraduisIndex(0);
        if (index == 1)
            tPointsVR.setraduisIndex(1);
        if (index == 2)
            tPointsVR.setraduisIndex(2);
        if (index == 3)
            tPointsVR.setraduisIndex(3);

    }
}
function changeMode(mode) {

    console.log(mode);
    if (methods.TeleportMode) {


        teleportVR.setMode(mode);
    }

    if (methods.flyMode) {
        console.log("modef");

        flyingVR.setMode(mode);
    }
}

function setChecked(prop) {
    for (let param in methods) {
        methods[param] = false;
    }
    methods[prop] = true;
}