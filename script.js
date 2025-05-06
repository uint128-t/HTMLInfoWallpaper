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
var ngraphm = ID("ngraphm");
var dgraphm = ID("dgraphm");
var cpup = ID("cpup");
var address = ID("address");
function utime(){
    let d = new Date();
    let ds = new Date();
    ds.setHours(0,0,0,0);
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
var uptime = Date.now()/1000; // temporary value
var socket = io();
socket.on("info",(data)=>{
    // CPU GRID
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

    // CPU INFO
    ID("cpu").textContent = data.processor;
    ID("ctx").textContent = data.ctx;
    ID("int").textContent = data.intr;

    // MEMORY
    ID("mem").children[0].style.width = `${100*data.used/data.total}%`;
    let disp = `${Math.floor(100*data.used/data.total)}% - ${(data.used/1024/1024/1024).toFixed(3)} GiB`;
    ID("mem").children[0].textContent = disp;
    ID("mem").children[1].textContent = disp;
    
    uptime = data.boot;

    // DISKS
    disks.replaceChildren();
    for (let i = 0; i < data.disks.length; i++){
        let pb = document.createElement("div");
        
        pb.classList.add("pbar");
        pb.style.marginLeft = "0";
        pb.style.width = "235px";
        let pbar = pb.appendChild(document.createElement("div"));
        pbar.classList.add("bar");
        let ptext = pb.appendChild(document.createElement("div"));
        ptext.classList.add("bartext");

        // Add ${data.disks[i].device} for device  
        let disp = `${data.disks[i].mountpoint} ${(data.disks[i].used/1024/1024/1024).toFixed(1)}/${(data.disks[i].total/1024/1024/1024).toFixed(1)} ${(data.disks[i].used/data.disks[i].total*100).toFixed(0)}%`;
        ptext.textContent = disp;
        pbar.textContent = disp;
        pbar.style.width = `${100*data.disks[i].used/data.disks[i].total}%`;
        disks.appendChild(pb);
    }

    // GRAPHS
    drawGraph(data.cpu,tcpu,data.netuprate,data.netdownrate,data.diskreadrate,data.diskwriterate);

    // NETWORK & DISK
    ID("netbytesent").textContent = `${Math.floor(data.netbytesent/1024/1024)} MiB`;
    ID("netbyterecv").textContent = `${Math.floor(data.netbyterecv/1024/1024)} MiB`;
    ID("netpacksent").textContent = data.netpacksent;
    ID("netpackrecv").textContent = data.netpackrecv;
    ID("netdownrate").textContent = `${autounit(data.netdownrate,2)}/s`;
    ID("netuprate").textContent = `${autounit(data.netuprate,2)}/s`;

    ID("diskbyteread").textContent = `${Math.floor(data.diskbyteread/1024/1024)} MiB`;
    ID("diskbytewrite").textContent = `${Math.floor(data.diskbytewrite/1024/1024)} MiB`;
    ID("diskreads").textContent = data.diskreads;
    ID("diskwrites").textContent = data.diskwrites;
    ID("diskreadrate").textContent = `${autounit(data.diskreadrate,2)}/s`;
    ID("diskwriterate").textContent = `${autounit(data.diskwriterate,2)}/s`;


    // ADDRESSES
    address.replaceChildren();
    console.log(data.addr);
    for (let ar of data.addr) {
        let alx=address.appendChild(document.createElement("li"));
        alx.classList.add("ipa");
        alx.textContent = ar;
    }

    // TEMPERATURES
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

    // BATTERY
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

    // CONNECTIONS
    conns.replaceChildren(conns.firstChild);
    for (let con of data.conn){
        let row = conns.appendChild(document.createElement("tr"));
        row.appendChild(document.createElement("td")).textContent = con.dest;
        row.appendChild(document.createElement("td")).textContent = con.dp;
        row.appendChild(document.createElement("td")).textContent = con.pid;
    }

    // FANS
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
    
    // USERS
    users.replaceChildren(users.firstChild);
    for (let user of data.users){
        let row = users.appendChild(document.createElement("tr"));
        let dur = Math.floor(Date.now()/1000-user.started);
        row.appendChild(document.createElement("td")).textContent = user.name;
        row.appendChild(document.createElement("td")).textContent = user.host;
        row.appendChild(document.createElement("td")).textContent = user.terminal;
        row.appendChild(document.createElement("td")).textContent = `${Math.floor(dur/3600)}:${String(Math.floor(dur/60%60)).padStart(2,"0")}:${String(Math.floor(dur%60)).padStart(2,"0")}`;
    }

    // PROCCESSES
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

    // SYSTEM
    ID("os").textContent = data.system;
    ID("name").textContent = data.node;
    ID("release").textContent = data.release;
    ID("machine").textContent = data.machine;
})

var cgraph = document.getElementById("cpugraph");
var ngraph = document.getElementById("ngraph");
var dgraph = document.getElementById("dgraph");
var cpug = null;
var netg = new ResourceGraph(ngraph,2,[COL_NETDOWN,COL_NETUP]);
var disg = new ResourceGraph(dgraph,2,[COL_DISREAD,COL_DISWRITE]);

function drawGraph(cpu,tcpu,ns,nr,dr,dw){
    if (cpug==null){
        let col = [];
        for (let i=0;i<cpu.length;i++){
            col.push(`hsl(${i*360/cpu.length},100%,50%)`);
        }
        cpug = new ResourceGraph(cgraph,cpu.length,col);
    }
    netg.update([nr,ns]);
    let nscl = netg.autoscale();
    netg.render(nscl)
    ngraphm.textContent = `${autounit(nscl)}/s`;

    disg.update([dr,dw]);
    let dscl = disg.autoscale();
    disg.render(dscl);
    dgraphm.textContent = `${autounit(dscl)}/s`;

    let cpusum = Array(cpu.length).fill(cpu[0]);
    for (let i=1;i<cpu.length;i++){
        cpusum[i] = cpusum[i-1]+cpu[i];
    }

    cpug.update(cpusum);
    cpug.render(100*cpu.length);
    cpup.textContent = `${(tcpu/cpu.length).toFixed(2)}%`;
}