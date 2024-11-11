const defaultTileSize = 32;
const defaultMapWidth = 16;  // Tiles across
const defaultMapHeight = 16; // Tiles down
let tileSize = defaultTileSize;
let mapWidth = defaultMapWidth;
let mapHeight = defaultMapHeight;

const tileData = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(-1));

const canvas = document.getElementById('tilemap');
const ctx = canvas.getContext('2d');
const tilePalette = document.getElementById('tilePalette');
let tilesetImage;
let selectedTileIndex = 0;
let isMouseDown = false;

// Draw grid with the current settings
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      
      // Only draw tiles that are >= 0
      if (tileData[y][x] >= 0 && tilesetImage) {
        const tileX = tileData[y][x] % (tilesetImage.width / tileSize);
        const tileY = Math.floor(tileData[y][x] / (tilesetImage.width / tileSize));

        ctx.drawImage(
          tilesetImage,
          tileX * tileSize, tileY * tileSize, tileSize, tileSize,
          x * tileSize, y * tileSize, tileSize, tileSize
        );
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
  tilePalette.innerHTML = ''; // Clear the existing tiles

  const numCols = Math.floor(tilesetImage.width / tileSize);
  const numRows = Math.floor(tilesetImage.height / tileSize);

  // Create containers for each row of tiles
  for (let row = 0; row < numRows; row++) {
    const rowContainer = document.createElement('div');
    rowContainer.classList.add('tile-row'); // Class to style each row container

    for (let col = 0; col < numCols; col++) {
      const tile = document.createElement('canvas');
      tile.width = tileSize;
      tile.height = tileSize;
      tile.classList.add('tile');
      tile.dataset.index = row * numCols + col; // Zero-based index

      const tileCtx = tile.getContext('2d');
      tileCtx.drawImage(tilesetImage, col * tileSize, row * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);

      tile.addEventListener('click', () => {
        document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('selected'));
        tile.classList.add('selected');
        selectedTileIndex = parseInt(tile.dataset.index); // Set selected tile index
      });

      rowContainer.appendChild(tile); // Add tile to row container
    }

    tilePalette.appendChild(rowContainer); // Add the row container to the palette
  }
}


// Place a tile on the grid when the mouse is dragged
function paintTile(event) {
  if (!isMouseDown) return; // Only paint if mouse is down

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / tileSize);
  const y = Math.floor((event.clientY - rect.top) / tileSize);

  if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
    tileData[y][x] = selectedTileIndex;
    drawGrid();
  }
}

// Handle mouse events for dragging
canvas.addEventListener('mousedown', (event) => {
  isMouseDown = true;
  paintTile(event); // Paint the tile on mousedown as well
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
        tiles: tileData
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
    // Reset tileData array to match the new grid size
    tileData.length = 0;
    for (let i = 0; i < mapHeight; i++) {
      tileData.push(new Array(mapWidth).fill(0));
    }
    canvas.width = mapWidth * tileSize;
    canvas.height = mapHeight * tileSize;
    drawGrid();
  }
});

// Initial drawing of the grid
drawGrid();
