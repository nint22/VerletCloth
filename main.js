
// Global variables
var scene;
var camera;
var renderer;

// Data structures
var ClothWidth = 20;
var ClothHeight = 10;

// Vertices (vertex)
var Vertices = new Array();

// Edges of vertices (index a, index b, natural length)
var Edges = new Array();

// Mesh data of the above
var mesh;

// Main application entry point
function main()
{
	// Cloth point / edge generation
	var geometry = new THREE.Geometry();
	geometry.dynamic = true;
	
	for(var y = 0; y < ClothHeight; y++)
	for(var x = 0; x < ClothWidth; x++)
	{
		// Generate point
		Vertices[y * ClothWidth + x] = {x: x - ClothWidth / 2.0, y: -y + ClothHeight / 2.0, oldx: x - ClothWidth / 2.0, oldy: -y + ClothHeight / 2.0};
		geometry.vertices.push( new THREE.Vector3(x, y, 0) );
			
		// For every row but the last..
		if(y < ClothHeight - 1)
			Edges[Edges.length] = {a: (y * ClothWidth + x), b: ((y + 1) * ClothWidth + x), length:1};
		
		// For every column but the last...
		if(x < ClothWidth - 1)
			Edges[Edges.length] = {a: (y * ClothWidth + x), b: (y * ClothWidth + x + 1), length:1};
		
		// We want to do an X shape across 
		if(x < ClothWidth - 1 && y < ClothHeight - 1)
		{
			// Note used: makes the system too stiff..
			//Edges[Edges.length] = {a: (y * ClothWidth + x), b: ((y + 1) * ClothWidth + x + 1), length:Math.sqrt(2)};
			//Edges[Edges.length] = {a: ((y + 1) * ClothWidth + x), b: (y * ClothWidth + x + 1), length:Math.sqrt(2)};
		}
		
		// Generate the quad face if possible
		if(x < ClothWidth - 1 && y < ClothHeight - 1)
			geometry.faces.push( new THREE.Face4( (y * ClothWidth + x), (y * ClothWidth + x + 1), ((y + 1) * ClothWidth + x + 1), ((y + 1) * ClothWidth + x) ) );
	}
	
	// Compute
	geometry.computeBoundingSphere();
	
	// Three scene generation
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	camera.position.z = 16;
	
	// Generate the grid geometry...
	mesh = new THREE.Mesh(geometry);
	scene.add(mesh);
	
	// Done with init; switch to render-cycle
	render();
}

// Main render loop
function render()
{
	// Step 1. Apply gravity
	for(var i = 0; i < ClothWidth * ClothHeight; i++)
	{
		// y-simulation
		Vertices[i].y -= 0.001; // We should just do 9.8 * dT * dT
		
		// Update for momentum
		var tempx  = Vertices[i].x;
		var tempy  = Vertices[i].y;
		Vertices[i].x += Vertices[i].x - Vertices[i].oldx;
		Vertices[i].y += Vertices[i].y - Vertices[i].oldy;
		Vertices[i].oldx = tempx;
		Vertices[i].oldy = tempy;
	}
	
	// Force our top-left corner to "stick" or be pinned to the wall
	Vertices[0] = { x: -ClothWidth / 2, y: ClothHeight / 2, oldx: -ClothWidth / 2, oldy: ClothHeight / 2 };
	Vertices[ClothWidth - 1] = { x: ClothWidth / 2 - 1, y: ClothHeight / 2, oldx: ClothWidth / 2 - 1, oldy: ClothHeight / 2 };
	
	// Step 2. Simulate tension!
	for(var simulationIndex = 0; simulationIndex < 2; simulationIndex++)
	{
		for(var i = 0; i < Edges.length; i++)
		{
			// Pull out edge
			var Edge = Edges[i];
		
			// For both dimensions
			var x1 = Vertices[ Edge.a ].x;
			var x2 = Vertices[ Edge.b ].x;
			
			var y1 = Vertices[ Edge.a ].y;
			var y2 = Vertices[ Edge.b ].y;
			
			// calculate the distance
			var diffX = x2 - x1;
			var diffY = y2 - y1;
			var d = Math.sqrt(diffX * diffX + diffY * diffY) 
			
			// Difference scalar
			var difference = Edge.length - d;
			
			// Translation for each PointMass. They'll be pushed 1/2 the required distance to match their resting distances.
			var translateX = (difference * diffX / d) * 0.51;
			var translateY = (difference * diffY / d) * 0.51;
			
			Vertices[ Edge.a ].x -= translateX
			Vertices[ Edge.a ].y -= translateY
			
			Vertices[ Edge.b ].x += translateX
			Vertices[ Edge.b ].y += translateY
			
			/*
			var delta = x2 - x1;
			delta *= Edge.length * Edge.length / (delta * delta + Edge.length * Edge.length) - 0.5;
			Vertices[ Edge.a ].x -= delta;
			Vertices[ Edge.b ].x += delta;
			
			delta = y2 - y1;
			delta *= Edge.length * Edge.length / (delta * delta + Edge.length * Edge.length) - 0.5;
			Vertices[ Edge.a ].y -= delta;
			Vertices[ Edge.b ].y += delta;
			*/
		}
	}
	
	// Step 3. Push simulated vertices changes to mesh changes
	for(var i = 0; i < ClothWidth * ClothHeight; i++)
	{
		mesh.geometry.vertices[i].x = Vertices[i].x;
		mesh.geometry.vertices[i].y = Vertices[i].y;
	}
	mesh.geometry.verticesNeedUpdate = true;
	
	// Done
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
