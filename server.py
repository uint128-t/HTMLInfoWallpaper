import flask
import flask_socketio
import psutil
import platform
import time
import math

INTERVAL = 1

app = flask.Flask("wallpaper")
socket = flask_socketio.SocketIO(app,async_mode="eventlet")
pt = platform.uname()._asdict()
cpum = platform.processor()
if not cpum:
    cinf = open("/proc/cpuinfo","r")
    for ln in cinf:
        if ln.startswith("model name"):
            cpum = ln.split(":")[1].strip()
            break
    cinf.close()
pt["processor"] = cpum

@app.route("/")
def index():
    return flask.send_file("desk.html")

@app.route("/<path:path>")
def send(path):
    return flask.send_from_directory(".",path)

def info():
    lastupdate = math.floor(time.monotonic())+1
    lbs = psutil.net_io_counters().bytes_sent
    lbr = psutil.net_io_counters().bytes_recv
    ldr = psutil.disk_io_counters().read_bytes
    lwr = psutil.disk_io_counters().write_bytes
    while True:
        cs = psutil.cpu_stats()
        vm = psutil.virtual_memory()
        drw = psutil.disk_io_counters()
        bat = psutil.sensors_battery()
        disks = []
        conn = []
        ps = [p.info for p in psutil.process_iter(["cpu_percent","name","pid","username",])]
        ps.sort(key=lambda x: x["cpu_percent"],reverse=True)
        kn = set()
        temp = {i:[v._asdict() for v in k if v.current] for i,k in psutil.sensors_temperatures().items()}
        for d in psutil.disk_partitions():
            du = psutil.disk_usage(d.mountpoint)
            disks.append({
                "device":d.device.split("/")[-1], # on linux systems remove /dev
                "mountpoint":d.mountpoint,
                "fstype":d.fstype,
                "opts":d.opts,
                "total":du.total,
                "used":du.used
            })
        for c in psutil.net_connections():
            if not c.raddr:
                continue
            if c.raddr.ip != "127.0.0.1":
                if (c.raddr.ip,c.raddr.port,c.pid) not in kn: # remove duplicates
                    conn.append({
                        "fd":c.fd,
                        "family":int(c.family),
                        "type":int(c.type),
                        "dest":c.raddr.ip,
                        "dp":c.raddr.port,
                        "status":c.status,
                        "pid":c.pid
                    })
                    kn.add((c.raddr.ip,c.raddr.port,c.pid))
        netbytesent = 0
        netbyterecv = 0
        netpacksent = 0
        netpackrecv = 0
        nioc = psutil.net_io_counters(pernic=True)
        for c in nioc:
            if c!="lo": # exclude loopback
                netbytesent+=nioc[c].bytes_sent
                netbyterecv+=nioc[c].bytes_recv
                netpacksent+=nioc[c].packets_sent
                netpackrecv+=nioc[c].packets_recv
        sendinfo = {
            "cpu":psutil.cpu_percent(percpu=True),
            "ctx":cs.ctx_switches,
            "intr":cs.interrupts,
            "freq":[i.current for i in psutil.cpu_freq(percpu=True)],
            "total":vm.total,
            "used":vm.used,
            "free":vm.free,
            "disks":disks,
            "netbytesent":netbytesent,
            "netbyterecv":netbyterecv,
            "netuprate":(netbytesent-lbs)/INTERVAL,
            "netdownrate":(netbyterecv-lbr)/INTERVAL,
            "netpacksent":netpacksent,
            "netpackrecv":netpackrecv,
            "diskbyteread":drw.read_bytes,
            "diskbytewrite":drw.write_bytes,
            "diskreadrate":(drw.read_bytes-ldr)/INTERVAL,
            "diskwriterate":(drw.write_bytes-lwr)/INTERVAL,
            "diskreads":drw.read_count,
            "diskwrites":drw.write_count,
            "conn":conn,
            "temp":temp,
            "fan":{i:[v._asdict() for v in x] for i,x in psutil.sensors_fans().items()},
            "battery":bat.percent,
            "time":bat.secsleft,
            "plugged":bat.power_plugged,
            "boot":psutil.boot_time(),
            "users":[x._asdict() for x in psutil.users()],
            "proc":ps[:5],
        }|pt
        lbs = netbytesent
        lbr = netbyterecv
        ldr = drw.read_bytes
        lwr = drw.write_bytes
        socket.emit("info",sendinfo)
        socket.sleep(lastupdate+INTERVAL-time.monotonic()) # more accurate timing
        lastupdate+=INTERVAL

socket.start_background_task(target=info)
socket.run(app,host="0.0.0.0",port=5000) # this can be changed, ports below 1024 require root