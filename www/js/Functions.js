var diceBody, scene,
    camera, renderer,
    dice, world,
    controls,
    WIDTH = 600, HEIGHT = 400;

/**
 * Inits the scene,
 * sets the cannon world,
 * sets the camera,
 * sets the WebGL render,
 */
function init_scene() {
    scene = new THREE.Scene();

    world = new CANNON.World();
    world.gravity.set(0, -10, 0);

    camera = new THREE.PerspectiveCamera(80, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.set(-1, 8, -1);
    camera.lookAt(new THREE.Vector3(-0.5, 0, -0.5));

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'dice_canvas';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);

    $('body').append(renderer.domElement);
}

/**
 * Adds the plane in which the dice will roll.
 */
function add_plane() {
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 50, 10, 10),
        new THREE.MeshPhongMaterial({color: 0xd0d0d0})
    );

    plane.rotation.x = -Math.PI * 0.5;
    plane.receiveShadow = true;
    scene.add(plane);

    world.add(new CANNON.Body({
        shape: new CANNON.Plane(),
        mass: 0,
        quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI * 0.5, 0, 0)
    }));
}

/**
 * Creates the dice geometry.
 */
function add_icosahedron_geometry() {
    var geometry = new THREE.IcosahedronGeometry(1),
        material = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('textures/d20.png'),
            specular: 0x303030,
            shininess: 1005
        });

    i = 0;
    geometry.faceVertexUvs[0] = [];

    for (i = 0; i < 10; i++) {
        geometry.faceVertexUvs[0][2 * i] = [
            new THREE.Vector2(i * 74 / 1024, 0),
            new THREE.Vector2((i + 1) * 74 / 1024, 0),
            new THREE.Vector2((i * 74 + 37) / 1024, 1)];
        geometry.faceVertexUvs[0][2 * i + 1] = [
            new THREE.Vector2((i * 74 + 37) / 1024, 1),
            new THREE.Vector2((i * 74 + 37 + 74) / 1024, 1),
            new THREE.Vector2((i + 1) * 74 / 1024, 0)];
    }

    //Here i set the OrbitControls so you can rotate the scene.
    controls = new THREE.OrbitControls(camera);
    dice = new THREE.Mesh(geometry, material);
    dice.castShadow = true;
    scene.add(dice);

    diceBody = new CANNON.Body({
        mass: 100,
        shape: gen_polyhedron(dice.geometry),
        material: new CANNON.Material({
            friction: 100,
            restitution: 1
        })
    });
    diceBody.angularDamping = 0.5;

    world.add(diceBody);
}

/**
 * Adds light to the scene.
 */
function add_light() {
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
}

/**
 * Creates the dice body based on a passed geometry.
 *
 * @param geometry
 * @returns {*}
 */
function gen_polyhedron(geometry) {
    var vertices = [], faces = [],
        i = 0, v = null, f = null;

    for (i = 0; i < geometry.vertices.length; i++) {
        v = geometry.vertices[i];
        vertices[i] = new CANNON.Vec3(v.x, v.y, v.z);
    }
    for (i = 0; i < geometry.faces.length; i++) {
        f = geometry.faces[i];
        faces[i] = [f.a, f.b, f.c];
    }

    return new CANNON.ConvexPolyhedron(vertices, faces);
}

/**
 * Rolls the dice according to a defined angle.
 */
function roll() {
    var angle = ((Math.random() - 0.5) * Math.PI * 2) * 0.1;

    diceBody.position.set(0, 2, -5);
    diceBody.velocity.set(Math.sin(angle) * 7, -1, Math.cos(angle) * 9);

    diceBody.angularVelocity.set((0.5 + Math.random() * 0.1) * Math.PI,
        (0.5 + Math.random() * 0.1) * Math.PI,
        (0.5 + Math.random() * 0.1) * Math.PI);

    diceBody.quaternion.setFromEuler(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI);
}

/**
 * Renders the dice according to the scene.
 */
function render() {
    world.step(100 / 3000);
    dice.position.copy(diceBody.position);
    dice.quaternion.copy(diceBody.quaternion);
    renderer.render(scene, camera);

    requestAnimationFrame(render);

};

/**
 * Inits the js to execute the rolling dice.
 */
$(function () {
    init_scene();
    add_plane();
    add_icosahedron_geometry();
    add_light();

    roll();

    controls.update();
    requestAnimationFrame(render);

    $('#dice_canvas').click(function () {
        roll();
        console.log(dice.position);

    });

});