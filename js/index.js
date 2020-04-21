'use strict';

let modal = document.getElementById('modal');

let button = document.getElementById('test');
button.addEventListener('click', function (event) {
    event.preventDefault();
    modal.style.display = 'block';
});

let close = document.getElementById('exit');

close.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|canvas| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var canvas = document.getElementById("sig-canvas");
var ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 5;
ctx.linejoin = "round";

// Set up mouse events for drawing
var drawing = false;
var mousePos = { x: 0, y: 0 };
var lastPos = mousePos;
canvas.addEventListener("mousedown", function (e) {
    drawing = true;
    lastPos = getMousePos(canvas, e);
}, false);
canvas.addEventListener("mouseup", function (e) {
    drawing = false;
}, false);
canvas.addEventListener("mousemove", function (e) {
    mousePos = getMousePos(canvas, e);
}, false);

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Draw to the canvas
function renderCanvas() {
    if (drawing) {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.closePath(); // new
        ctx.stroke();
        lastPos = mousePos;
    }
}

// Allow for animation
(function drawLoop() {
    requestAnimFrame(drawLoop);
    renderCanvas();
})();

// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (e) {
    mousePos = getTouchPos(canvas, e);
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);
document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);
document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);
//mobile end

// end of canvas

document.getElementById('upload').addEventListener("click", function (e) {
    document.getElementById('spiral-res').innerHTML = '';
    var img = canvas.toDataURL("image/png");
    // getAPIFile(img);
    callModel(img);
}, false);

document.getElementById('clear').addEventListener("click", function (e) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
}, false);

document.getElementById('retry').addEventListener('click', function(e) {
    resetModal();
}, false)

document.getElementById('finish').addEventListener('click', function(e) {
    resetModal();
    modal.style.display = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    // save the data to database, and populate database

})

function resetModal() {
    document.getElementById('spiral-cont').style.display = 'block';
    document.getElementById('spiral-res').innerHTML = '';

    document.getElementById('upload').style.display = 'flex';
    document.getElementById('clear').style.display = 'flex';
    // show new buttons
    document.getElementById('retry').style.display = 'none';
    document.getElementById('finish').style.display = 'none';
}


// make blob

function makeblob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
};

//   ~~~~~~~~~~~~~~~~~~~~~request~~~~~~~~~~~~~~~~~~~~~~~~ //

function callModel(img) {
    let url = "https://westus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/6fede207-de99-4fbe-8f04-44a2154495ad/classify/iterations/Iteration8/image";
    let imgBlob = makeblob(img);
    // const req = new Request()
    fetch(url, {
        headers: {
            "Prediction-Key": "78a3f4d1ae95492680685c14da50480d",
            "Content-Type": "application/octet-stream",
            "Prediction-key": "78a3f4d1ae95492680685c14da50480d"
        },
        method: 'POST',
        // processData: false,
        body: imgBlob
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            populateResult(data, img);
        })
        .catch(function (error) {
            console.log('err');
        });
}

function populateResult(data, img) {
    let parkisonsPercentage;
    let healthyPercentage;
    if (data.predictions[0].tagName === 'parkinson') {
        parkisonsPercentage = data.predictions[0].probability;
        healthyPercentage = data.predictions[1].probability;
    } else {
        healthyPercentage = data.predictions[0].probability;
        parkisonsPercentage = data.predictions[1].probability;
    }
    let text = ''
    if (healthyPercentage <= parkisonsPercentage) {
        text = `Our model shows that your spiral is ${(parkisonsPercentage * 100).toFixed(1)}% similar to known Parkinson's spirals.`;
    } else {
        text = `Our model shows that your spiral is ${(healthyPercentage * 100).toFixed(1)}% similar to known healthy spirals.`;
    }

    document.getElementById('spiral-cont').style.display = 'none';
    let parent = document.getElementById('spiral-res');

    let div = document.createElement('div');
    div.innerHTML = text;
    div.classList.add('result');
    parent.appendChild(div);

    let desc = document.createElement('div');
    desc.innerHTML = 'These results will be logged and sent to your doctor you may try again. Otherwise you may download your spiral or share directly with your Doctor.';
    desc.classList.add('res-desc');
    parent.appendChild(desc);

    // let down = document.createElement('div');
    // down.innerHTML = 'Download';
    // down.classList.add('dl-spiral');
    // parent.appendChild(down);
    
    let smallImg = document.createElement('img');
    smallImg.src = img;
    smallImg.classList.add('res-img');
    parent.appendChild(smallImg);

    // remove old buttons
    document.getElementById('upload').style.display = 'none';
    document.getElementById('clear').style.display = 'none';
    // show new buttons
    document.getElementById('retry').style.display = 'flex';
    document.getElementById('finish').style.display = 'flex';
}