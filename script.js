const ID = document.getElementById.bind(document);
var lt;
var ld;
var hourE = ID("hour");
var minuteE = ID("minute");
var timeE = ID("time");
var dateE = ID("date");
var disks = ID("disks");
var temps = ID("temps");
var bat = ID("bat");
var conns = ID("conns");
var fans = ID("fans");
var users = ID("users");
var proc = ID("proc");
const startD = 7*60*60*1000;
const endD = 22*60*60*1000;
function utime(){
    let d = new Date();
    let ds = new Date();
    ds.setHours(0,0,0,0);
    let secsS = d-ds;
    let time = d.toLocaleTimeString();
    let day = d.toLocaleDateString("en-US",{weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (time!=lt){
        lt = time;
        timeE.textContent = time;

        let secR = `${60-d.getSeconds()}s left`;
        minuteE.children[0].style.width = `${100*d.getSeconds()/60}%`;
        minuteE.children[0].textContent = secR;
        minuteE.children[1].textContent = secR;

        let minR = `${60-d.getMinutes()}m left`;
        hourE.children[0].style.width = `${100*(d.getMinutes()*60+d.getSeconds())/3600}%`;
        hourE.children[0].textContent = minR;
        hourE.children[1].textContent = minR;

        let ut = Math.floor(new Date().getTime()/1000-uptime);
        ID("uptime").textContent = `${Math.floor(ut/3600)}:${String(Math.floor(ut/60)%60).padStart(2,"0")}:${String(ut%60).padStart(2,"0")}`;
    }
    if (day!=ld){
        ld = day;
        dateE.textContent = day;
    }
    requestAnimationFrame(utime);
}
utime();

var cpus = document.getElementById("cpus");
const COLUMNS = 3;
var uptime = Date.now()/1000; // temporary value
var socket = io();
socket.on("info",(data)=>{
    console.log(data);
    cpus.replaceChildren();
    let row;
    let tcpu = 0;
    for (let i = 0; i < data.cpu.length; i++){
        if (i%COLUMNS==0){
            row=cpus.appendChild(document.createElement("tr"));
        }
        let cell = row.appendChild(document.createElement("td"))
        cell.innerText = `${data.cpu[i].toFixed(1)}   %\n${data.freq[i].toFixed(0)} MHz`;
        cell.style.backgroundColor = `rgba(0,255,0,${data.cpu[i]/100})`
        tcpu+=data.cpu[i];
    }
    ID("cpu").textContent = data.processor;
    ID("ctx").textContent = data.ctx;
    ID("int").textContent = data.intr;
    ID("mem").children[0].style.width = `${100*data.used/data.total}%`;
    let disp = `${Math.floor(100*data.used/data.total)}% - ${(data.used/1024/1024/1024).toFixed(3)} GiB`;
    ID("mem").children[0].textContent = disp;
    ID("mem").children[1].textContent = disp;
    
    uptime = data.boot;

    disks.replaceChildren();
    for (let i = 0; i < data.disks.length; i++){
        let pb = document.createElement("div");
        
        pb.classList.add("pbar");
        pb.style.marginLeft = "0";
        pb.style.width = "100%";
        let pbar = pb.appendChild(document.createElement("div"));
        pbar.classList.add("bar");
        let ptext = pb.appendChild(document.createElement("div"));
        ptext.classList.add("bartext");

        let disp = `${data.disks[i].device} ${(data.disks[i].used/1024/1024/1024).toFixed(1)}/${(data.disks[i].total/1024/1024/1024).toFixed(1)} ${(data.disks[i].used/data.disks[i].total*100).toFixed(0)}%`;
        ptext.textContent = disp;
        pbar.textContent = disp;
        pbar.style.width = `${100*data.disks[i].used/data.disks[i].total}%`;
        disks.appendChild(pb);
    }
    drawGraph(data.cpu,tcpu);
    ID("bs").textContent = `${Math.floor(data.nsent/1024/1024)} MiB`;
    ID("br").textContent = `${Math.floor(data.nrecv/1024/1024)} MiB`;
    ID("ps").textContent = data.psent;
    ID("pr").textContent = data.precv;
    temps.replaceChildren();
    for (let k in data.temp){
        let div = temps.appendChild(document.createElement("div"));
        div.appendChild(document.createTextNode(k));
        let list = div.appendChild(document.createElement("ul"));
        for (let i = 0; i < data.temp[k].length; i++){
            let li = list.appendChild(document.createElement("li"));
            li.textContent = `${data.temp[k][i].label || "?"}: ${data.temp[k][i].current.toFixed(2)}°C`;
        }
    }
    let secsleft = data.time;
    let minleft = (secsleft/60%60).toFixed(0).padStart(2,"0");
    let hourleft = (secsleft/3600).toFixed(0);
    let dt;
    if (data.plugged){
        dt = `${data.battery.toFixed(1)}% - Charging`;
    } else{
        dt = `${data.battery.toFixed(1)}% - ${hourleft}:${minleft}`;
    }
    bat.children[0].style.width = `${data.battery}%`;
    bat.children[0].textContent = dt;
    bat.children[1].textContent = dt;

    conns.replaceChildren(conns.firstChild);
    for (let con of data.conn){
        let row = conns.appendChild(document.createElement("tr"));
        row.appendChild(document.createElement("td")).textContent = con.dest;
        row.appendChild(document.createElement("td")).textContent = con.dp;
        row.appendChild(document.createElement("td")).textContent = con.fd;
    }
    fans.replaceChildren();
    for (let k in data.fan){
        let div = fans.appendChild(document.createElement("div"));
        div.appendChild(document.createTextNode(k));
        let list = div.appendChild(document.createElement("ul"));
        for (let i = 0; i < data.fan[k].length; i++) {
            let li = list.appendChild(document.createElement("li"));
            li.textContent = `${data.fan[k][i].label || "?"}: ${data.fan[k][i].current.toFixed(1)}`;
        }
    }
    
    users.replaceChildren(users.firstChild);
    for (let user of data.users){
        let row = users.appendChild(document.createElement("tr"));
        let dur = Math.floor(Date.now()/1000-user.started);
        row.appendChild(document.createElement("td")).textContent = user.name;
        row.appendChild(document.createElement("td")).textContent = user.host;
        row.appendChild(document.createElement("td")).textContent = user.terminal;
        console.log(dur);
        row.appendChild(document.createElement("td")).textContent = `${Math.floor(dur/3600)}:${String(Math.floor(dur/60%60)).padStart(2,"0")}:${String(Math.floor(dur%60)).padStart(2,"0")}`;
    }

    proc.replaceChildren(proc.firstChild);
    for (let p of data.proc){
        let row = proc.appendChild(document.createElement("tr"));
        row.appendChild(document.createElement("td")).textContent = p.name;
        row.appendChild(document.createElement("td")).textContent = p.pid;
        row.appendChild(document.createElement("td")).textContent = `${(p.cpu_percent/data.cpu.length).toFixed(1)}%`;
        // cpu usage on all cores

        // row.appendChild(document.createElement("td")).textContent = `${(p.cpu_percent).toFixed(1)}%`;
        // above line for cpu usage on one core
        row.appendChild(document.createElement("td")).textContent = p.username;
    }
    ID("os").textContent = data.system;
    ID("name").textContent = data.node;
    ID("release").textContent = data.release;
    ID("machine").textContent = data.machine;
})

var cpuK = []; // CPU history for each core
var cpuD = []; // Graph to draw
var graph = document.getElementById("cpugraph");
graph.width = 230*devicePixelRatio;
graph.height = 100*devicePixelRatio;
var cpug = graph.getContext("2d");
var cpuI = 0;
const VALS = 24;
const PIXELS = 10;

function drawGraph(cpu,tcpu){
    if (cpuK.length!=cpu.length){
        cpuK = [];
        cpuD = [];
        for (let i = 0; i < cpu.length; i++){
            cpuK.push(Array(VALS).fill(0));
            cpuD.push(Array(VALS).fill(0));
        }
    }
    for (let i = 0; i < cpu.length; i++){
        cpuK[i][cpuI%VALS] = cpu[i];
        cpuD[i][cpuI%VALS] = cpu[i];
        if (i>0){
            cpuD[i][cpuI%VALS] += cpuD[i-1][cpuI%VALS];
        }
    }
    cpuI = (cpuI+1)%VALS;
    cpug.clearRect(0,0,230*devicePixelRatio,100*devicePixelRatio);
    for (let i=0;i<cpuD.length;i++){
        // for each core
        for (let j=1;j<VALS;j++){
            cpug.beginPath();
            cpug.moveTo(devicePixelRatio*(j*PIXELS-PIXELS),Math.round(devicePixelRatio*(100-(cpuD[i][(j-1+cpuI)%VALS]/cpuD.length)*1.5)));
            cpug.lineTo(devicePixelRatio*j*PIXELS,Math.round(devicePixelRatio*(100-(cpuD[i][(j+cpuI)%VALS]/cpuD.length)*1.5)));
            cpug.strokeStyle = `hsl(${i*360/cpuD.length},100%,50%)`; // change to white for one color only
            cpug.strokeWidth = 1;
            cpug.stroke();
        }
    }
    cpug.font = `${15*devicePixelRatio}px monospace`
    cpug.fillStyle = "white";
    cpug.fillText(`${(tcpu/cpu.length).toFixed(2)}%`,devicePixelRatio*10,devicePixelRatio*20);
}

onresize = ()=>{
    graph.width = 230*devicePixelRatio;
    graph.height = 100*devicePixelRatio;
};
