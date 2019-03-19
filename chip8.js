var font = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, 
    0x20, 0x60, 0x20, 0x20, 0x70, 
    0xF0, 0x10, 0xF0, 0x80, 0xF0, 
    0xF0, 0x10, 0xF0, 0x10, 0xF0, 
    0x90, 0x90, 0xF0, 0x10, 0x10, 
    0xF0, 0x80, 0xF0, 0x10, 0xF0, 
    0xF0, 0x80, 0xF0, 0x90, 0xF0, 
    0xF0, 0x10, 0x20, 0x40, 0x40, 
    0xF0, 0x90, 0xF0, 0x90, 0xF0, 
    0xF0, 0x90, 0xF0, 0x10, 0xF0, 
    0xF0, 0x90, 0xF0, 0x90, 0x90, 
    0xE0, 0x90, 0xE0, 0x90, 0xE0, 
    0xF0, 0x80, 0x80, 0x80, 0xF0, 
    0xE0, 0x90, 0x90, 0x90, 0xE0, 
    0xF0, 0x80, 0xF0, 0x80, 0xF0, 
    0xF0, 0x80, 0xF0, 0x80, 0x80
];

class Chip8 {
    reset(){
        this.pc = 0x200;
        this.drawFlag = false;
        
        this.gfx = [];

        for(let i = 0; i<2048; i++)
            this.gfx[i] = 0;
    
        this.delay_timer = 0;
        this.sound_timer = 0;

        this.memory = [];
        this.stack = [];
        this.V = [];
        this.key = [];
    
        for(let i = 0; i<4096; i++)
            this.memory[i] = 0;
    
        for(let i = 0; i < 80; i++)
            this.memory[i] = font[i];
    
        for(let i = 0; i<16; i++) {
            this.stack[i] = 0;
            this.V[i] = 0;
            this.key[i] = 0;
        }
        
        this.sp = 0;
        this.opcode = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    Load(game) {
        this.reset();
        let r = new XMLHttpRequest();
        r.open("GET", "/games/" + game, true);
        r.responseType = "arraybuffer";

        r.onload = function (event) {
            let arrayBuffer = r.response;
            if (arrayBuffer) {
                let byteArray = new Uint8Array(arrayBuffer);
                for (let i = 0; i < byteArray.byteLength; i++)
                    window.chip8.memory[i + 512] = byteArray[i];
                window.running = true;
            }
        };
        r.send(null);
    }

    draw() {
        return this.drawFlag;
    }

    emulateCycle() {

        this.opcode = (this.memory[this.pc] << 8) | (this.memory[this.pc+1]);
    
        //std::cout << "0x" << std::hex << std::uppercase << opcode << std::nouppercase << std::dec << std::endl;
        let vx = (this.opcode & 0x0F00) >> 8;
        let vy = (this.opcode & 0x00F0) >> 4;
    
        switch(this.opcode & 0xF000){
            case 0x0000:
                switch(this.opcode){
                    case 0x00E0:
                        for(let i = 0; i<2048; i++)
                            this.gfx[i] = 0;
                        
                        this.drawFlag = true;
                        this.pc += 2;
    
                        break;
                    case 0x00EE:
                        --this.sp;
                        this.pc = this.stack[this.sp];
                        this.pc += 2;
                        break;
    
                    default:
                        //std::cout << std::dec << opcode << std::endl;
                        //exit(1);
                        console.log("ERROR 0: " + this.opcode);
                        window.running = false;
                        break;
                    }
    
                break;
            
    
            case 0x1000:
            this.pc = this.opcode & 0x0FFF;
                break;
    
            case 0x2000:
                this.stack[this.sp] = this.pc;
                ++this.sp;
                this.pc = this.opcode & 0x0FFF;
                break;
    
            case 0x3000:
                if(this.V[vx] == (this.opcode & 0x00FF))
                    this.pc += 2;
                this.pc += 2;
                break;
    
            case 0x4000:
                if(this.V[vx] != (this.opcode & 0x00FF))
                    this.pc += 2;
                this.pc += 2;
                break;
    
            case 0x5000:
                if(this.V[vx] == this.V[vy])
                    this.pc += 2;
                this.pc += 2;
                break;
    
            case 0x6000:
                this.V[vx] = this.opcode & 0x00FF;
                this.pc += 2;
                break;
    
            case 0x7000:
                this.V[vx] += (this.opcode & 0x00FF);
                this.pc += 2;
                break;
    
            case 0x8000:
                switch(this.opcode & 0x000F){
                    case 0x0000:
                        this.V[vx] = this.V[vy];
                        this.pc += 2;
                        break;
    
                    case 0x0001:
                        this.V[vx] |= this.V[vy];
                        this.pc += 2;
                        break;
    
                    case 0x0002:
                        this.V[vx] &= this.V[vy];
                        this.pc += 2;
                        break;
    
                    case 0x0003:
                        this.V[vx] ^= this.V[vy];
                        this.pc += 2;
                        break;
    
                    case 0x0004:
                        this.V[vx] += this.V[vy];
                        if(this.V[vy] > (0xFF - this.V[vx]))
                            this.V[0xF] = 1;
                        else
                            this.V[0xF] = 0;
                        this.pc += 2;
                        break;
    
                    case 0x0005:
                        if(this.V[vy] > this.V[vx])
                            this.V[0xF] = 0;
                        else
                            this.V[0xF] = 1;
                        this.V[vx] -= this.V[vy];  
                        this.pc += 2;
                        break;
    
                    case 0x0006:
                        this.V[0xF] = this.V[vx] & 0x01;
                        this.V[vx] >>= 1;
                        this.pc += 2;
                        break;
                    
                    case 0x0007:
                        if(this.V[vx] > this.V[vy])
                            this.V[0xF] = 0;
                        else
                            this.V[0xF] = 1;
                        this.V[vx] = this.V[vy] - this.V[vx];   
                        this.pc += 2;
                        break;
                    
                    case 0x000E:{
                        this.V[0xF] = this.V[vx] >> 7;
                        this.V[vx] <<= 1;
                        this.pc += 2;
                        break;
                    }
                    default:
                        //std::cout << "Unknown opcode: " << std::hex << opcode << std::endl;
                        //exit(1);
                        console.log("ERROR 8: " + this.opcode);
                        window.running = false;
                        break;
                }
                break;
    
            case 0x9000:
                if(this.V[vx] != this.V[vy])
                    this.pc += 2;
                this.pc += 2;
                break;
    
            case 0xA000:
                this.I = this.opcode & 0x0FFF;
                this.pc += 2;
                break;
    
            case 0xB000:
                this.pc = (this.opcode & 0x0FFF) + this.V[0];
                break;
            
            case 0xC000:
                this.V[vx] = (Math.floor(Math.random() * (0xFF))) & (this.opcode & 0x00FF);
                this.pc += 2;
                break;
    
            case 0xD000: {
                let x = this.V[vx];
                let y = this.V[vy];
                let h = this.opcode & 0x000F;
                let p;
    
                this.V[0xF] = 0;
                for(let vertical = 0; vertical < h; vertical++){
                    p = this.memory[this.I + vertical];
                    for(let horizontal = 0; horizontal < 8; horizontal++){
                        if((p & (0x80 >> horizontal)) != 0){
                            if(this.gfx[(x + horizontal + ((vertical + y) * 64))] == 1)
                                this.V[0xF] = 1;
                            this.gfx[x + horizontal + ((vertical + y) * 64)] ^= 1;
                        }
                    }
                }
    
                this.drawFlag = true;
                this.pc += 2;
                break;
            }
    
            case 0xE000:
                switch(this.opcode & 0x00FF){
                    case 0x009E:
                        if(this.key[this.V[vx]] != 0)
                            this.pc += 2;
                        this.pc += 2;
                        break;
    
                    case 0x00A1:
                        if(this.key[this.V[vx]] == 0)
                            this.pc += 2;
                        this.pc += 2;                
                        break;
                    default:
                        //std::cout << "Unknown Opcode: " << std::hex << opcode << std::endl;
                        //exit(1);
                        console.log("ERROR UNKNOWN OPCODE E: " + this.opcode);
                        window.running = false;
                        break;
                }
    
                break;
    
            case 0xF000:
                switch(this.opcode & 0x00FF){
                    case 0x0007:
                    this.V[vx] = this.delay_timer;
                    this.pc += 2;
                        break;
    
                    case 0x000A:{
                        let pressed = false;
                        for(let i = 0; i < 16; ++i){
                            if(this.key[i] != 0){
                                this.V[vx] = i;
                                pressed = true;
                            }
                        }
    
                        if(!pressed)
                            return;
    
                        this.pc += 2;
                        break;
                    }
    
                    case 0x0015:
                        this.delay_timer = this.V[vx];
                        this.pc += 2;
                        break;
    
                    case 0x0018:
                        this.sound_timer = this.V[vx];
                        this.pc += 2;
                        break;
    
                    case 0x001E:
                        if(this.I + this.V[vx] > 0xFFF)
                            this.V[0xF] = 1;
                        else
                            this.V[0xF] = 0;
                        this.I += this.V[vx];
                        this.pc += 2;
                        break;
    
                    case 0x0029:
                        this.I = this.V[vx] * 0x5;
                        this.pc += 2;
                        break;
    
                    case 0x0033:
                        this.memory[this.I] =this.V[vx] / 100;
                        this.memory[this.I + 1] = (this.V[vx] / 10) % 10;
                        this.memory[this.I + 2] = this.V[vx] % 10;
                        this.pc += 2;
                        break;
    
                    case 0x0055:{
                        for(let i = 0; i <= vx; ++i)
                            this.memory[this.I + i] = this.V[i];
                        this.I += vx + 1;
                        this.pc += 2;
                        break;
                    }
                    case 0x0065:{
                        for(let i = 0; i <= vx; ++i)
                            this.V[i] = this.memory[this.I + i];
                        this.I += vx + 1;
                        this.pc += 2;
                        break;
                    }
                    default:
                        //std::cout << "Unknown Opcode: " << std::hex << opcode << std::endl;
                        //exit(1);
                        console.log("ERROR UNKNOWN OPCODE F: " + this.opcode);
                        window.running = false;
                        break;
                }
    
                break;
    
            default:
                //std::cout << "Unknown opcode: " << std::hex << opcode << std::endl;
                //exit(1);
                console.log("ERROR UNKNOWN OPCODE ?: " + this.opcode);
                window.running = false;
                break;
        }
    
    
        if(this.delay_timer > 0)
            --this.delay_timer;
        
        if(this.sound_timer > 0){
            if(this.sound_timer == 1){
                //beep?
            }
            --this.sound_timer;
        }
    }
}