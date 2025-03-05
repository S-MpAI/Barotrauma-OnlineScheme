const canvas = document.getElementById('diagramCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 2;
canvas.height = window.innerHeight * 2;

const ws = new WebSocket('ws://localhost:8080');

let components = [];
let wires = [];
let selectedItem = null;
let isDragging = false;
let startConnection = null;
let tempWire = null;
const gridSize = 40;
let hoveredItem = null;
let dragStartX = 0;
let dragStartY = 0;
let componentStartX = 0;
let componentStartY = 0;
let lastConnectionTime = 0;
const debounceDelay = 200;

class ComponentsClasses {
    constructor(type) {
        this.type = type;
    }

    getMetaComponent() {
        if (this.type === "wifi") {
            this.MetaBackroundColor = "#1e1614";
            this.MetaName = "Wi-Fi";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В", "НАЗНАЧИТЬ_КАНАЛ"];
            this.sizeX = 6;
            this.sizeY = 6;
        } else if (this.type === "Checking_the_signal") {
            this.MetaBackroundColor = "#141c0f";
            this.MetaName = "Проверка сигнала";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В", "НАЗНАЧИТЬ_ИСХОДЯЩЕЕ_ЗНАЧЕНИЕ", "НАЗНАЧИТЬ_ЦЕЛЕВОЙ_СИГНАЛ"];
            this.sizeX = 10;
            this.sizeY = 7;
        } else if (this.type === "Memory") {
            this.MetaBackroundColor = "#291b1a";
            this.MetaName = "Память";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В", "ЗАКРЕПИТЬ_СОСТОЯНИЕ"];
            this.sizeX = 6;
            this.sizeY = 6;
        } else if (this.type === "Relay") {
            this.MetaBackroundColor = "#1b1110";
            this.MetaName = "Реле";
            this.MetaOut = ["ЭНЕРГИЯ_ИЗ", "СИГНАЛ_ИЗ_1", "СИГНАЛ_ИЗ_2", "СОСТОЯНИЕ_ИЗ", "ЗНАЧЕНИЕ_ЗАГРУЗКИ_ИЗ", "ЗНАЧЕНИЕ_ЭНЕРГИИ_ИЗ"];
            this.MetaIn = ["ЭНЕРГИЯ_В", "СИГНАЛ_В_1", "СИГНАЛ_В_2", "ПЕРЕКЛЮЧИТЬ_СОСТОЯНИЕ", "НАЗНАЧИТЬ_СОСТОЯНИЕ"];
            this.sizeX = 8;
            this.sizeY = 18;
        } else if (this.type === "Equally") {
            this.MetaBackroundColor = "#1b2a5e";
            this.MetaName = "Равно";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В_1", "СИГНАЛ_В_2", "НАЗНАЧИТЬ_ИСХОДЯЩЕЕ_ЗНАЧЕНИЕ"];
            this.sizeX = 6;
            this.sizeY = 8;
        } else if (this.type === "Or") {
            this.MetaBackroundColor = "#373123";
            this.MetaName = "Или";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В_1", "СИГНАЛ_В_2", "НАЗНАЧИТЬ_ИСХОДЯЩЕЕ_ЗНАЧЕНИЕ"];
            this.sizeX = 6;
            this.sizeY = 8;
        } else if (this.type === "And") {
            this.MetaBackroundColor = "#1a1f35";
            this.MetaName = "И";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В_1", "СИГНАЛ_В_2", "НАЗНАЧИТЬ_ИСХОДЯЩЕЕ_ЗНАЧЕНИЕ"];
            this.sizeX = 6;
            this.sizeY = 8;
        } else if (this.type === "Addition") {
            this.MetaBackroundColor = "#29361d";
            this.MetaName = "Сложение";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В_1", "СИГНАЛ_В_2"];
            this.sizeX = 6;
            this.sizeY = 6;
        } else if (this.type === "Relationship") {
            this.MetaBackroundColor = "#3e1403";
            this.MetaName = "Взаимосвязь";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["СИГНАЛ_В_1", "СИГНАЛ_В_2"];
            this.sizeX = 6;
            this.sizeY = 6;
        } else if (this.type === "Oscillator") {
            this.MetaBackroundColor = "#25201c";
            this.MetaName = "Осциллятор";
            this.MetaOut = ["СИГНАЛ_ИЗ"];
            this.MetaIn = ["НАЗНАЧИТЬ_ЧАСТОТУ", "НАЗНАЧИТЬ_ТИП_ИСХОДЯЩЕГО_ЗНАЧЕНИЯ"];
            this.sizeX = 8;
            this.sizeY = 6;
        } else if (this.type === "InputSelector") {
            this.MetaBackroundColor = "#3d1514";
            this.MetaName = "Селектор входа";
            this.MetaOut = ["СИГНАЛ_ИЗ", "ВЫБР_ВХОД_ВНЕШ"];
            this.MetaIn = ["СИГНАЛ_В_0", "СИГНАЛ_В_1", "СИГНАЛ_В_2", "СИГНАЛ_В_3", "СИГНАЛ_В_4", "СИГНАЛ_В_5", "СИГНАЛ_В_6", "СИГНАЛ_В_7", "СИГНАЛ_В_8", "СИГНАЛ_В_9", "ЗАДАТЬ_ВХОД", "ДВИЖ_ВХОД"];
            this.sizeX = 6;
            this.sizeY = 14;
        } else if (this.type === "MainInput") {
            this.MetaBackroundColor = "#273528";
            this.MetaName = null;
            this.MetaOut = [];
            this.MetaIn = ["СИГНАЛ_В_0", "СИГНАЛ_В_1", "СИГНАЛ_В_2", "СИГНАЛ_В_3", "СИГНАЛ_В_4", "СИГНАЛ_В_5", "СИГНАЛ_В_6", "СИГНАЛ_В_7", "СИГНАЛ_В_8"];
            this.sizeX = 6;
            this.sizeY = 10;
        } else if (this.type === "MainOutput") {
            this.MetaName = null;
            this.MetaBackroundColor = "#3e191a";
            this.MetaOut = ["СИГНАЛ_ИЗ_0", "СИГНАЛ_ИЗ_1", "СИГНАЛ_ИЗ_2", "СИГНАЛ_ИЗ_3", "СИГНАЛ_ИЗ_4", "СИГНАЛ_ИЗ_5", "СИГНАЛ_ИЗ_6", "СИГНАЛ_ИЗ_7", "СИГНАЛ_ИЗ_8"];
            this.MetaIn = [];
            this.sizeX = 6;
            this.sizeY = 10;
        } else {
            console.log('Не определён: ', this.type);
        }
    }
}

class Component {
    constructor(type, x, y, id) {
        this.meta = new ComponentsClasses(type);
        this.meta.getMetaComponent();
        this.type = this.meta.MetaName || type;
        this.x = Math.round(x / gridSize) * gridSize;
        this.y = Math.round(y / gridSize) * gridSize;
        this.width = this.meta.sizeX * gridSize;
        this.height = this.meta.sizeY * gridSize;
        this.inputs = [...(this.meta.MetaIn || [])];
        this.outputs = [...(this.meta.MetaOut || [])];
        this.id = id;
        this.backroundColor = this.meta.MetaBackroundColor || '#4a4a4a';
        this.connections = { 
            inputs: Array(this.inputs.length).fill().map(() => []), 
            outputs: Array(this.outputs.length).fill().map(() => []) 
        };
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.backroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        if (this.type) {
            ctx.fillText(this.type, this.x + 5, this.y + 20);
        }

        ctx.fillStyle = '#ff0000';
        const textOffsetX = 10;
        const textOffsetY = 15;
        const pinRadius = 10;
        this.inputs.forEach((input, index) => {
            const inputY = this.y + (index + 0.5) * (this.height / this.inputs.length);
            ctx.beginPath();
            ctx.arc(this.x + textOffsetX, inputY, pinRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(input, this.x + textOffsetX + pinRadius + 5, inputY + textOffsetY / 2);
            ctx.fillStyle = '#ff0000';
        });

        this.outputs.forEach((output, index) => {
            const outputY = this.y + (index + 0.5) * (this.height / this.outputs.length);
            const textWidth = ctx.measureText(output).width;
            const rightOffset = textOffsetX + textWidth + pinRadius + 5;
            ctx.beginPath();
            ctx.arc(this.x + this.width - textOffsetX, outputY, pinRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(output, this.x + this.width - rightOffset, outputY + textOffsetY / 2);
            ctx.fillStyle = '#ff0000';
        });

        if (hoveredItem === this) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Wire {
    constructor(color, startComp, endComp, startPin, endPin, isInputToOutput = false) {
        this.color = color;
        this.startComp = startComp;
        this.endComp = endComp;
        this.startPin = startPin;
        this.endPin = endPin;
        this.isInputToOutput = isInputToOutput;
        this.id = `${startComp.id}-${startPin}-${endComp.id}-${endPin}-${Date.now()}`;
    }

    draw() {
        if (this.startComp && this.endComp) {
            let startX, startY, endX, endY;
            if (this.isInputToOutput) {
                startX = this.startComp.x;
                startY = this.startComp.y + (this.startPin + 0.5) * (this.startComp.height / this.startComp.inputs.length);
                endX = this.endComp.x + this.endComp.width;
                endY = this.endComp.y + (this.endPin + 0.5) * (this.endComp.height / this.endComp.outputs.length);
            } else {
                startX = this.startComp.x + this.startComp.width;
                startY = this.startComp.y + (this.startPin + 0.5) * (this.startComp.height / this.startComp.outputs.length);
                endX = this.endComp.x;
                endY = this.endComp.y + (this.endPin + 0.5) * (this.endComp.height / this.endComp.inputs.length);
            }

            const connections = this.isInputToOutput 
                ? this.startComp.connections.inputs[this.startPin]
                : this.startComp.connections.outputs[this.startPin];
            const sameConnections = connections.filter(conn => conn.comp === this.endComp && conn.pin === this.endPin);
            const wireIndex = sameConnections.findIndex(conn => conn.wire.id === this.id);
            const offset = wireIndex * 40;

            const direction = endX - startX > 0 ? 1 : -1;
            const controlX1 = startX + (endX - startX) * 0.3 + offset * 0.8;
            const controlY1 = startY - offset * direction * 4;
            const controlX2 = startX + (endX - startX) * 0.7 - offset * 0.8;
            const controlY2 = endY - offset * direction * 4;

            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
            ctx.stroke();
            ctx.closePath();
        }
    }

    isPointOnWire(x, y) {
        let startX, startY, endX, endY;
        if (this.isInputToOutput) {
            startX = this.startComp.x;
            startY = this.startComp.y + (this.startPin + 0.5) * (this.startComp.height / this.startComp.inputs.length);
            endX = this.endComp.x + this.endComp.width;
            endY = this.endComp.y + (this.endPin + 0.5) * (this.endComp.height / this.endComp.outputs.length);
        } else {
            startX = this.startComp.x + this.startComp.width;
            startY = this.startComp.y + (this.startPin + 0.5) * (this.startComp.height / this.startComp.outputs.length);
            endX = this.endComp.x;
            endY = this.endComp.y + (this.endPin + 0.5) * (this.endComp.height / this.endComp.inputs.length);
        }

        const connections = this.isInputToOutput 
            ? this.startComp.connections.inputs[this.startPin]
            : this.startComp.connections.outputs[this.startPin];
        const sameConnections = connections.filter(conn => conn.comp === this.endComp && conn.pin === this.endPin);
        const wireIndex = sameConnections.findIndex(conn => conn.wire.id === this.id);
        const offset = wireIndex * 40;

        const direction = endX - startX > 0 ? 1 : -1;
        const controlX1 = startX + (endX - startX) * 0.3 + offset * 0.8;
        const controlY1 = startY - offset * direction * 4;
        const controlX2 = startX + (endX - startX) * 0.7 - offset * 0.8;
        const controlY2 = endY - offset * direction * 4;

        const steps = 100;
        for (let t = 0; t <= 1; t += 1 / steps) {
            const t2 = t * t;
            const t3 = t2 * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;

            const px = mt3 * startX + 3 * mt2 * t * controlX1 + 3 * mt * t2 * controlX2 + t3 * endX;
            const py = mt3 * startY + 3 * mt2 * t * controlY1 + 3 * mt * t2 * controlY2 + t3 * endY;

            const dx = x - px;
            const dy = y - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 5) {
                return true;
            }
        }
        return false;
    }
}

function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.closePath();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    components.forEach(comp => comp.draw());
    wires.forEach(wire => wire.draw());

    if (startConnection && tempWire) {
        let startX, startY;
        if (tempWire.isInputStart) {
            startX = startConnection.x;
            startY = startConnection.y + (tempWire.startPin + 0.5) * (startConnection.height / startConnection.inputs.length);
        } else {
            startX = startConnection.x + startConnection.width;
            startY = startConnection.y + (tempWire.startPin + 0.5) * (startConnection.height / startConnection.outputs.length);
        }
        const endX = tempWire.endX;
        const endY = tempWire.endY;

        const controlX1 = startX + (endX - startX) * 0.3;
        const controlY1 = startY;
        const controlX2 = startX + (endX - startX) * 0.7;
        const controlY2 = endY;

        ctx.beginPath();
        ctx.strokeStyle = tempWire.color;
        ctx.lineWidth = 3;
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
        ctx.stroke();
        ctx.closePath();
    }
}

function addComponent(type) {
    const x = 100;
    const y = 100;
    const id = components.length;
    const comp = new Component(type, x, y, id);
    components.push(comp);
    redraw();
    ws.send(JSON.stringify({ type: 'add', component: { type, x, y, id } }));
}

function connectComponents(startComp, endComp, startPin, endPin, color, isInputToOutput = false) {
    const now = Date.now();
    if (now - lastConnectionTime < debounceDelay) {
        console.log('Connection throttled to prevent multiple triggers');
        startConnection = null;
        tempWire = null;
        return;
    }
    lastConnectionTime = now;

    if (startComp && endComp && startComp !== endComp && startPin >= 0 && endPin >= 0) {
        if (isInputToOutput) {
            if (startPin >= startComp.inputs.length || endPin >= endComp.outputs.length) return;
            const existingWires = startComp.connections.inputs[startPin].filter(conn => conn.comp === endComp && conn.pin === endPin).length;
            const maxWires = 10;
            if (existingWires >= maxWires) {
                console.log(`Maximum number of wires (${maxWires}) reached between ${startComp.type} input ${startPin} and ${endComp.type} output ${endPin}`);
                startConnection = null;
                tempWire = null;
                return;
            }
            const wire = new Wire(color, startComp, endComp, startPin, endPin, true);
            wires.push(wire);
            startComp.connections.inputs[startPin].push({ comp: endComp, pin: endPin, wire });
            endComp.connections.outputs[endPin].push({ comp: startComp, pin: startPin, wire });
            console.log(`Wire added. Total wires: ${wires.length}, ID: ${wire.id}`);
            console.log(`Connected ${startComp.type} input ${startPin} to ${endComp.type} output ${endPin} with color ${color}`);
        } else {
            if (startPin >= startComp.outputs.length || endPin >= endComp.inputs.length) return;
            const existingWires = startComp.connections.outputs[startPin].filter(conn => conn.comp === endComp && conn.pin === endPin).length;
            const maxWires = 10;
            if (existingWires >= maxWires) {
                console.log(`Maximum number of wires (${maxWires}) reached between ${startComp.type} output ${startPin} and ${endComp.type} input ${endPin}`);
                startConnection = null;
                tempWire = null;
                return;
            }
            const wire = new Wire(color, startComp, endComp, startPin, endPin, false);
            wires.push(wire);
            startComp.connections.outputs[startPin].push({ comp: endComp, pin: endPin, wire });
            endComp.connections.inputs[endPin].push({ comp: startComp, pin: startPin, wire });
            console.log(`Wire added. Total wires: ${wires.length}, ID: ${wire.id}`);
            console.log(`Connected ${startComp.type} output ${startPin} to ${endComp.type} input ${endPin} with color ${color}`);
        }
        redraw();
        ws.send(JSON.stringify({ 
            type: 'addWire', 
            wire: { color, startId: startComp.id, endId: endComp.id, startPin, endPin, isInputToOutput } 
        }));
    }
    startConnection = null;
    tempWire = null;
}

function removeComponent(id) {
    const index = components.findIndex(comp => comp.id === id);
    if (index !== -1) {
        const comp = components[index];
        components.splice(index, 1);
        wires = wires.filter(wire => {
            if (wire.startComp.id === id || wire.endComp.id === id) {
                console.log(`Wire removed: ${wire.id}`);
                return false;
            }
            return true;
        });
        components.forEach(c => {
            c.connections.inputs.forEach(connArray => {
                for (let i = connArray.length - 1; i >= 0; i--) {
                    if (connArray[i].comp.id === id) connArray.splice(i, 1);
                }
            });
            c.connections.outputs.forEach(connArray => {
                for (let i = connArray.length - 1; i >= 0; i--) {
                    if (connArray[i].comp.id === id) connArray.splice(i, 1);
                }
            });
        });
        redraw();
        ws.send(JSON.stringify({ type: 'remove', id }));
        console.log(`Removed component with id: ${id}`);
    }
}

function removeWire(wireId) {
    const wireIndex = wires.findIndex(wire => wire.id === wireId);
    if (wireIndex !== -1) {
        const wire = wires[wireIndex];
        if (wire.isInputToOutput) {
            const inputConn = wire.startComp.connections.inputs[wire.startPin];
            const outputConn = wire.endComp.connections.outputs[wire.endPin];
            inputConn.splice(inputConn.findIndex(conn => conn.wire.id === wireId), 1);
            outputConn.splice(outputConn.findIndex(conn => conn.wire.id === wireId), 1);
        } else {
            const outputConn = wire.startComp.connections.outputs[wire.startPin];
            const inputConn = wire.endComp.connections.inputs[wire.endPin];
            outputConn.splice(outputConn.findIndex(conn => conn.wire.id === wireId), 1);
            inputConn.splice(inputConn.findIndex(conn => conn.wire.id === wireId), 1);
        }
        wires.splice(wireIndex, 1);
        redraw();
        ws.send(JSON.stringify({ type: 'removeWire', wireId }));
        console.log(`Removed wire with id: ${wireId}`);
    }
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверка только для левой кнопки мыши (button === 0)
    if (e.button !== 0) return;

    selectedItem = components.find(comp => 
        x >= comp.x && x <= comp.x + comp.width &&
        y >= comp.y && y <= comp.y + comp.height
    );

    console.log('Clicked on:', selectedItem, 'at', x, y, 'isDragging:', isDragging);

    if (selectedItem && !isDragging) {
        const outputIndex = selectedItem.outputs.findIndex((_, index) => {
            const outputY = selectedItem.y + (index + 0.5) * (selectedItem.height / selectedItem.outputs.length);
            return Math.abs(y - outputY) <= 10;
        });
        const inputIndex = selectedItem.inputs.findIndex((_, index) => {
            const inputY = selectedItem.y + (index + 0.5) * (selectedItem.height / selectedItem.inputs.length);
            return Math.abs(y - inputY) <= 10;
        });

        if (outputIndex !== -1) {
            startConnection = selectedItem;
            tempWire = { startPin: outputIndex, color: document.getElementById('wireColor').value, endX: x, endY: y, isInputStart: false };
            console.log('Connection started from:', startConnection.type, 'output pin:', outputIndex);
        } else if (inputIndex !== -1) {
            startConnection = selectedItem;
            tempWire = { startPin: inputIndex, color: document.getElementById('wireColor').value, endX: x, endY: y, isInputStart: true };
            console.log('Connection started from:', startConnection.type, 'input pin:', inputIndex);
        } else {
            isDragging = true;
            dragStartX = x;
            dragStartY = y;
            componentStartX = selectedItem.x;
            componentStartY = selectedItem.y;
            console.log('Dragging started for:', selectedItem.type, 'dragStart:', dragStartX, dragStartY, 'componentStart:', componentStartX, componentStartY);
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoveredItem = components.find(comp => 
        x >= comp.x && x <= comp.x + comp.width &&
        y >= comp.y && y <= comp.y + comp.height
    );

    if (isDragging && selectedItem) {
        const dx = x - dragStartX;
        const dy = y - dragStartY;
        selectedItem.x = componentStartX + dx;
        selectedItem.y = componentStartY + dy;
        redraw();
        console.log('Dragging to:', selectedItem.x.toFixed(2), selectedItem.y.toFixed(2), 'dx:', dx.toFixed(2), 'dy:', dy.toFixed(2));
    } else if (startConnection && tempWire) {
        tempWire.endX = x;
        tempWire.endY = y;
        redraw();
    } else {
        redraw();
    }
});

canvas.addEventListener('mouseup', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверка только для левой кнопки мыши (button === 0)
    if (e.button !== 0) return;

    if (isDragging) {
        isDragging = false;
        if (selectedItem) {
            selectedItem.x = Math.round(selectedItem.x / gridSize) * gridSize;
            selectedItem.y = Math.round(selectedItem.y / gridSize) * gridSize;
            ws.send(JSON.stringify({
                type: 'move',
                component: {
                    type: selectedItem.type,
                    x: selectedItem.x,
                    y: selectedItem.y,
                    id: selectedItem.id
                }
            }));
        }
        console.log('Dragging stopped, final position:', selectedItem ? { x: selectedItem.x, y: selectedItem.y } : 'none');
        selectedItem = null;
    } else if (startConnection && tempWire) {
        const endComp = components.find(comp => 
            comp !== startConnection && 
            x >= comp.x && x <= comp.x + comp.width &&
            y >= comp.y && y <= comp.y + comp.height
        );
        if (endComp) {
            if (tempWire.isInputStart) {
                const outputIndex = endComp.outputs.findIndex((_, index) => {
                    const outputY = endComp.y + (index + 0.5) * (endComp.height / endComp.outputs.length);
                    return Math.abs(y - outputY) <= 10;
                });
                if (outputIndex !== -1) {
                    connectComponents(startConnection, endComp, tempWire.startPin, outputIndex, tempWire.color, true);
                } else {
                    console.log('No valid output found, connection canceled');
                    startConnection = null;
                    tempWire = null;
                    redraw();
                }
            } else {
                const inputIndex = endComp.inputs.findIndex((_, index) => {
                    const inputY = endComp.y + (index + 0.5) * (endComp.height / endComp.inputs.length);
                    return Math.abs(y - inputY) <= 10;
                });
                if (inputIndex !== -1) {
                    connectComponents(startConnection, endComp, tempWire.startPin, inputIndex, tempWire.color, false);
                } else {
                    console.log('No valid input found, connection canceled');
                    startConnection = null;
                    tempWire = null;
                    redraw();
                }
            }
        } else {
            console.log('No target component found, connection canceled');
            startConnection = null;
            tempWire = null;
            redraw();
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Предотвращаем стандартное контекстное меню браузера
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверка клика по проводу
    const clickedWire = wires.find(wire => wire.isPointOnWire(x, y));
    if (clickedWire) {
        removeWire(clickedWire.id);
        return;
    }

    // Проверка клика по компоненту
    const clickedComponent = components.find(comp => 
        x >= comp.x && x <= comp.x + comp.width &&
        y >= comp.y && y <= comp.y + comp.height
    );
    if (clickedComponent) {
        removeComponent(clickedComponent.id);
    }
});

ws.onmessage = (event) => {
    let data;
    if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
            data = JSON.parse(reader.result);
            handleMessage(data);
        };
        reader.readAsText(event.data);
    } else {
        data = JSON.parse(event.data);
        handleMessage(data);
    }
};

function handleMessage(data) {
    if (data.type === 'add') {
        const existing = components.find(c => c.id === data.component.id);
        if (!existing) {
            components.push(new Component(data.component.type, data.component.x, data.component.y, data.component.id));
        }
        redraw();
    } else if (data.type === 'move') {
        const comp = components.find(c => c.id === data.component.id);
        if (comp) {
            comp.x = data.component.x;
            comp.y = data.component.y;
            redraw();
        }
    } else if (data.type === 'addWire') {
        const startComp = components.find(c => c.id === data.wire.startId);
        const endComp = components.find(c => c.id === data.wire.endId);
        if (startComp && endComp) {
            connectComponents(startComp, endComp, data.wire.startPin, data.wire.endPin, data.wire.color, data.wire.isInputToOutput);
        }
    } else if (data.type === 'remove') {
        removeComponent(data.id);
    } else if (data.type === 'removeWire') {
        removeWire(data.wireId);
    }
}

redraw();

document.getElementById('toolbar').innerHTML = `
    <button onclick="addComponent('Relay')">Реле</button>
    <button onclick="addComponent('wifi')">Wi-Fi</button>
    <button onclick="addComponent('Checking_the_signal')">Проверка сигнала</button>
    <button onclick="addComponent('Memory')">Память</button>
    <button onclick="addComponent('Equally')">Равно</button>
    <button onclick="addComponent('Or')">Или</button>
    <button onclick="addComponent('And')">И</button>
    <button onclick="addComponent('Addition')">Сложение</button>
    <button onclick="addComponent('Relationship')">Взаимосвязь</button>
    <button onclick="addComponent('Oscillator')">Осциллятор</button>
    <button onclick="addComponent('InputSelector')">Селектор входа</button>
    <button onclick="addComponent('MainInput')">Главный вход</button>
    <button onclick="addComponent('MainOutput')">Главный выход</button>
    <select id="wireColor">
        <option value="red">Красный</option>
        <option value="blue">Синий</option>
        <option value="green">Зеленый</option>
        <option value="yellow">Желтый</option>
        <option value="purple">Фиолетовый</option>
    </select>
`;