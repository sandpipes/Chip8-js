
var ctx;
var canvas;

function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    setInterval(loop, 1);
}

function loop() {
    if(!window.running) return;

    window.chip8.emulateCycle();
        
    if(window.chip8.draw()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let x = 0; x < 64; x++){
            for(let y = 0; y < 32; y++){
                if(window.chip8.gfx[x + (y * 64)] == 1)
                    ctx.fillRect(x*10, y*10, 10, 10);
            }
        }
    }

}

window.onload = init;