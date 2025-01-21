class ResourceGraph{
    constructor(canvas,dc,dcol){
        this.canvas = canvas;
        this.canvas.width = CANVAS_W*devicePixelRatio;
        this.canvas.height = CANVAS_H*devicePixelRatio;
        this.ctx = canvas.getContext("2d");
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.dc = dc;
        this.data = [];
        for (let i=0;i<dc;i++){
            this.data.push(Array(VALS).fill(0));
        }
        this.dcol = dcol;
        this.index = 0;
        addEventListener("resize",()=>{
            this.canvas.width = CANVAS_W*devicePixelRatio;
            this.canvas.height = CANVAS_H*devicePixelRatio;
            console.log("scle")
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
        });
    }
    render(scale){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        for (let s=0;s<this.dc;s++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.dcol[s];
            this.ctx.lineWidth = 1;
            for (let i=0;i<VALS-1;i++){
                this.ctx.moveTo(i*PIXELS,CANVAS_H-CANVAS_H*this.data[s][(i+this.index)%VALS]/scale);
                this.ctx.lineTo((i+1)*PIXELS,CANVAS_H-CANVAS_H*this.data[s][(i+this.index+1)%VALS]/scale);
            }
            this.ctx.stroke();
        }
    }
    update(vals){
        for (let i=0;i<this.dc;i++){
            this.data[i][this.index] = vals[i];
        }
        this.index = (this.index+1)%VALS;
    }
    autoscale(){
        let max = Math.max(...this.data.flat());
        let p2 = Math.log2(max);
        let scl = Math.pow(2, Math.ceil(p2));
        return scl;
    }
}

function autounit(val){
    let unit = 0;
    while (val>=1024 && unit<UNITS.length){
        val/=1024;
        unit++;
    }
    return `${Math.floor(val)} ${UNITS[unit]}`
}

function autounit(val,de){
    let unit = 0;
    while (val>=1024 && unit<UNITS.length){
        val/=1024;
        unit++;
    }
    return `${val.toFixed(de)} ${UNITS[unit]}`
}