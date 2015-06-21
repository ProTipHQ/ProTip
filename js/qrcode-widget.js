function createQRCodeCanvas(text) {
    var sizeMultiplier = 4;
    var typeNumber;
    var lengthCalculation = text.length * 8 + 12;
    if (lengthCalculation < 72) {
        typeNumber = 1;
    } else if (lengthCalculation < 128) {
        typeNumber = 2;
    } else if (lengthCalculation < 208) {
        typeNumber = 3;
    } else if (lengthCalculation < 288) {
        typeNumber = 4;
    } else if (lengthCalculation < 368) {
        typeNumber = 5;
    } else if (lengthCalculation < 480) {
        typeNumber = 6;
    } else if (lengthCalculation < 528) {
        typeNumber = 7;
    } else if (lengthCalculation < 688) {
        typeNumber = 8;
    } else if (lengthCalculation < 800) {
        typeNumber = 9;
    } else if (lengthCalculation < 976) {
        typeNumber = 10;
    }
    var qrcode = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
    qrcode.addData(text);
    qrcode.make();
    var width = qrcode.getModuleCount() * sizeMultiplier;
    var height = qrcode.getModuleCount() * sizeMultiplier;
    // create canvas element
    var canvas = document.createElement('canvas');
    var scale = 10.0;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    // compute tileW/tileH based on width/height
    var tileW = width / qrcode.getModuleCount();
    var tileH = height / qrcode.getModuleCount();
    // draw in the canvas
    for (var row = 0; row < qrcode.getModuleCount(); row++) {
        for (var col = 0; col < qrcode.getModuleCount(); col++) {
            ctx.fillStyle = qrcode.isDark(row, col) ? "#000000" : "#ffffff";
            ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
        }
    }
    return canvas;
}
