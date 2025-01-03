// Configurations
const NODE_RADIUS = 20; 
const NODE_SPACING = 30;
const LEVEL_SPACING = 40; // Distance between vertical levels
const MARGIN = 50; // Margin from the top of the canvas
const ANIMATION_DELAY = 500; // Delay between each step of the animation
const LINE_WIDTH = 2;

const DEFAULT_NODE_COLOR = 'DodgerBlue';
const DEFAULT_TEXT_COLOR = '#fff';
const DEFAULT_STROKE_COLOR = '#003300';
const LINE_COLOR = '#000';

const HIGHLIGHT_COLOR = 'coral'; // Highlight color for animating add/remove
const FOUND_COLOR = 'green'; // Color for found node when searching

// Variables for scaling and panning
const KEY_SCALE_AMOUNT = 1.1
const WHEEL_SCALE_AMOUNT = 1.05
let scale = 1;
let translateX = 0;
let translateY = 0;

class Node {
    constructor(data, left = null, right = null) {
        this.data = data;
        this.left = left;
        this.right = right;
        this.x = 0;
        this.y = 0;
    }
}

class BST {
    constructor() {
        this.root = null;
    }

    async animateAdd(data) {
        if (this.root === null) {
            this.root = new Node(data);
            drawTree();
            return;
        }
        let current = this.root;
        let parent = null;
        while (current) {
            drawTree(current);
            await sleep(ANIMATION_DELAY);
            parent = current;
            if (data < current.data) {
                current = current.left;
            } else if (data > current.data) {
                current = current.right;
            } else {
                return;
            }
        }
        if (data < parent.data) {
            parent.left = new Node(data);
        } else {
            parent.right = new Node(data);
        }
        drawTree();
    }

    async animateRemove(data) {
        this.root = await this._animateRemoveNode(this.root, data);
        drawTree();
    }

    async _animateRemoveNode(node, data) {
        if (node == null) {
            return null;
        }
        drawTree(node);
        await sleep(ANIMATION_DELAY);
        if (data == node.data) {
            drawTree(node);
            await sleep(ANIMATION_DELAY);
            if (node.left == null && node.right == null) {
                return null;
            }
            if (node.left == null || node.right == null) {
                let child = node.left !== null ? node.left : node.right;
                drawTree(child);
                await sleep(ANIMATION_DELAY);
                return child;
            }
            let successorParent = node;
            let successor = node.right;
            while (successor.left !== null) {
                successorParent = successor;
                successor = successor.left;
                drawTree(successor);
                await sleep(ANIMATION_DELAY);
            }
            node.data = successor.data;
            if (successorParent !== node) {
                successorParent.left = await this._animateRemoveNode(successor, successor.data);
            } else {
                node.right = await this._animateRemoveNode(node.right, successor.data);
            }
            return node;
        } else if (data < node.data) {
            node.left = await this._animateRemoveNode(node.left, data);
            return node;
        } else {
            node.right = await this._animateRemoveNode(node.right, data);
            return node;
        }
    }

    async animateSearch(data) {
        let current = this.root;
        while (current) {
            drawTree(current);
            await sleep(ANIMATION_DELAY);
            if (data == current.data) {
                drawTree(current, true);
                await sleep(ANIMATION_DELAY);
                return true;
            } else if (data < current.data) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        drawTree();
        alert("Значення не знайдено в дереві.");
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initalization
const bst = new BST();
const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');

// Handlers for zooming
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
        scale *= WHEEL_SCALE_AMOUNT;
    } else {
        scale /= WHEEL_SCALE_AMOUNT;
    }
    drawTree();
});

window.addEventListener('keydown', (event) => {
    if (event.key === '[') {
        scale /= KEY_SCALE_AMOUNT;
        drawTree();
    } else if (event.key === ']') {
        scale *= KEY_SCALE_AMOUNT;
        drawTree();
    }
});

// Button handlers
const addNodeBtn = document.getElementById('add-node');
const removeNodeBtn = document.getElementById('remove-node');
const searchNodeBtn = document.getElementById('search-node');
const nodeValueInput = document.getElementById('node-value');

addNodeBtn.addEventListener('click', async () => {
    const value = parseInt(nodeValueInput.value);
    if (!isNaN(value)) {
        addNodeBtn.disabled = true;
        removeNodeBtn.disabled = true;
        searchNodeBtn.disabled = true;
        await bst.animateAdd(value);
        nodeValueInput.value = '';
        addNodeBtn.disabled = false;
        removeNodeBtn.disabled = false;
        searchNodeBtn.disabled = false;
    }
});

removeNodeBtn.addEventListener('click', async () => {
    const value = parseInt(nodeValueInput.value);
    if (!isNaN(value)) {
        addNodeBtn.disabled = true;
        removeNodeBtn.disabled = true;
        searchNodeBtn.disabled = true;
        await bst.animateRemove(value);
        nodeValueInput.value = '';
        addNodeBtn.disabled = false;
        removeNodeBtn.disabled = false;
        searchNodeBtn.disabled = false;
    }
});

searchNodeBtn.addEventListener('click', async () => {
    const value = parseInt(nodeValueInput.value);
    if (!isNaN(value)) {
        addNodeBtn.disabled = true;
        removeNodeBtn.disabled = true;
        searchNodeBtn.disabled = true;
        await bst.animateSearch(value);
        nodeValueInput.value = '';
        addNodeBtn.disabled = false;
        removeNodeBtn.disabled = false;
        searchNodeBtn.disabled = false;
    }
});

// Event handlers for panning
let isDragging = false;
let startX, startY;

canvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    startX = event.offsetX;
    startY = event.offsetY;
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const dx = (event.offsetX - startX) / scale;
        const dy = (event.offsetY - startY) / scale;
        translateX += dx;
        translateY += dy;
        startX = event.offsetX;
        startY = event.offsetY;
        drawTree();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Drawing functions
function drawTree(highlightedNode = null, found = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!bst.root) return;

    let x = 0;
    const setPositions = (node, depth) => {
        if (node.left) {
            setPositions(node.left, depth + 1);
        }
        node.x = x++;
        node.y = depth;
        if (node.right) {
            setPositions(node.right, depth + 1);
        }
    };

    setPositions(bst.root, 0);

    let maxX = 0;
    const findMaxX = (node) => {
        if (!node) return;
        if (node.x > maxX) maxX = node.x;
        findMaxX(node.left);
        findMaxX(node.right);
    };

    findMaxX(bst.root);

    const totalNodes = maxX + 1;
    const treeWidth = totalNodes * NODE_SPACING;
    const offsetX = (canvas.width - treeWidth) / 2;
    const offsetY = MARGIN;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2 + translateX, -canvas.height / 2 + translateY);

    const drawNode = (node) => {
        const x = node.x * NODE_SPACING + offsetX + NODE_SPACING / 2;
        const y = node.y * LEVEL_SPACING + offsetY;

        if (node.left) {
            const childX = node.left.x * NODE_SPACING + offsetX + NODE_SPACING / 2;
            const childY = node.left.y * LEVEL_SPACING + offsetY;
            drawLine(x, y, childX, childY);
            drawNode(node.left);
        }
        if (node.right) {
            const childX = node.right.x * NODE_SPACING + offsetX + NODE_SPACING / 2;
            const childY = node.right.y * LEVEL_SPACING + offsetY;
            drawLine(x, y, childX, childY);
            drawNode(node.right);
        }

        let strokeColor = DEFAULT_STROKE_COLOR;
        if (node === highlightedNode) {
            strokeColor = found ? FOUND_COLOR : HIGHLIGHT_COLOR;
        }

        drawCircle(x, y, node.data, strokeColor);
    };

    const drawLine = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = LINE_WIDTH / scale;
        ctx.stroke();
    };

    const drawCircle = (x, y, data, strokeColor = DEFAULT_STROKE_COLOR) => {
        ctx.beginPath();
        ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI, false);
        ctx.fillStyle = DEFAULT_NODE_COLOR;
        ctx.fill();
        ctx.lineWidth = LINE_WIDTH / scale;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        ctx.fillStyle = DEFAULT_TEXT_COLOR;
        ctx.font = `${14 / scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data, x, y);
    };

    drawNode(bst.root);

    ctx.restore();
}
