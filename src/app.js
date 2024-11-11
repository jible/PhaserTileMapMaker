const defaultTileSize = 32;
const defaultMapWidth = 16;
const defaultMapHeight = 16;
let tileSize = defaultTileSize;
let mapWidth = defaultMapWidth;
let mapHeight = defaultMapHeight;

// Create two layers: one for tiles and one for objects
const tileLayer = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(-1));
const objectLayer = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));

const canvas = document.getElementById('tilemap');
const ctx = canvas.getContext('2d');
const tilePalette = document.getElementById('tilePalette');
let tilesetImage;
let selectedTileIndex = -1;
let isMouseDown = false;

let objects = {};              // Store objects with names as keys
let selectedObject = null;     // Track the selected object (if any)

// Draw grid with the current settings
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background tile layer
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

      const tileValue = tileLayer[y][x];
      if (tileValue >= 0 && tilesetImage) {
        const tileX = tileValue % (tilesetImage.width / tileSize);
        const tileY = Math.floor(tileValue / (tilesetImage.width / tileSize));
        ctx.drawImage(
          tilesetImage,
          tileX * tileSize, tileY * tileSize, tileSize, tileSize,
          x * tileSize, y * tileSize, tileSize, tileSize
        );
      }
    }
  }

  // Draw object layer on top of the tile layer
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const objectValue = objectLayer[y][x];
      if (objectValue) {
        // Draw a placeholder for objects, could also render an icon or label
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.fillStyle = "black";
        ctx.font = "10px Arial";
        ctx.fillText(objectValue, x * tileSize + 2, y * tileSize + tileSize / 2);
      }
    }
  }
}

// Load tileset image and populate the tile palette
document.getElementById('tilesetLoader').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      tilesetImage = new Image();
      tilesetImage.onload = () => {
        populateTilePalette();
        drawGrid();
      };
      tilesetImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Populate the tile palette with tiles from the loaded tileset image
function populateTilePalette() {
  tilePalette.innerHTML = '';

  const numCols = Math.floor(tilesetImage.width / tileSize);
  const numRows = Math.floor(tilesetImage.height / tileSize);

  for (let row = 0; row < numRows; row++) {
    const rowContainer = document.createElement('div');
    rowContainer.classList.add('tile-row');

    for (let col = 0; col < numCols; col++) {
      const tile = document.createElement('canvas');
      tile.width = tileSize;
      tile.height = tileSize;
      tile.classList.add('tile');
      tile.dataset.index = row * numCols + col;

      const tileCtx = tile.getContext('2d');
      tileCtx.drawImage(tilesetImage, col * tileSize, row * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);

      tile.addEventListener('click', () => {
        document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('selected'));
        tile.classList.add('selected');
        selectedTileIndex = parseInt(tile.dataset.index);
        selectedObject = null;
      });

      rowContainer.appendChild(tile);
    }

    tilePalette.appendChild(rowContainer);
  }
}

// Handle adding objects
document.getElementById('addObjectButton').addEventListener('click', () => {
  const objectName = prompt("Enter the name of the new object:");
  if (objectName) {
    objects[objectName] = objectName;
    displayObjects();
  }
});

// Display objects in the object list
function displayObjects() {
  const objectList = document.getElementById('objectList');
  objectList.innerHTML = '';

  Object.keys(objects).forEach(name => {
    const objectItem = document.createElement('div');
    objectItem.classList.add('object-item');
    objectItem.innerText = name;

    objectItem.addEventListener('click', () => {
      document.querySelectorAll('.object-item').forEach(item => item.classList.remove('selected'));
      objectItem.classList.add('selected');
      selectedObject = name;
      selectedTileIndex = -1;
    });

    objectList.appendChild(objectItem);
  });
}

// Place a tile or an object on the grid when the mouse is dragged
function paintTile(event) {
  if (!isMouseDown) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / tileSize);
  const y = Math.floor((event.clientY - rect.top) / tileSize);

  if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
    if (selectedObject) {
      objectLayer[y][x] = selectedObject; // Place object on the object layer
    } else {
      tileLayer[y][x] = selectedTileIndex; // Place tile on the tile layer
    }
    drawGrid();
  }
}

// Handle mouse events for dragging
canvas.addEventListener('mousedown', (event) => {
  isMouseDown = true;
  paintTile(event);
});

canvas.addEventListener('mousemove', paintTile);

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
});

// Export the tilemap data to a JSON file
document.getElementById('exportButton').addEventListener('click', () => {
  const mapJson = {
    tileSize: tileSize,
    width: mapWidth,
    height: mapHeight,
    layers: [
      {
        name: "background",
        tiles: tileLayer
      },
      {
        name: "objects",
        objects: objectLayer
      }
    ]
  };

  const jsonStr = JSON.stringify(mapJson, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = "tilemap.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Toggle the grid/tiles resize controls
document.getElementById('resizeButton').addEventListener('click', () => {
  const resizeControls = document.getElementById('resizeControls');
  resizeControls.style.display = resizeControls.style.display === 'none' ? 'flex' : 'none';
});

// Apply new grid and tile sizes from user input
document.getElementById('applyResize').addEventListener('click', () => {
  const newWidth = parseInt(document.getElementById('gridWidth').value);
  const newHeight = parseInt(document.getElementById('gridHeight').value);
  const newTileSize = parseInt(document.getElementById('tileSize').value);

  if (newWidth && newHeight && newTileSize) {
    mapWidth = newWidth;
    mapHeight = newHeight;
    tileSize = newTileSize;
    tileLayer.length = 0;
    objectLayer.length = 0;
    for (let i = 0; i < mapHeight; i++) {
      tileLayer.push(new Array(mapWidth).fill(-1));
      objectLayer.push(new Array(mapWidth).fill(null));
    }
    canvas.width = mapWidth * tileSize;
    canvas.height = mapHeight * tileSize;
    drawGrid();
  }
});

// Initial drawing of the grid
drawGrid();
