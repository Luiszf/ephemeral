import { defineAction } from "astro:actions";
import { spawn } from "node:child_process";
import https from "node:https";
import fs from "node:fs";
import { z } from "astro:schema";
import { gVersions } from "./versions.ts";
import os from 'node:os';

const v = gVersions();

let states;

try {
    states = {}
    fs.readdirSync("servers").forEach((server) => { 
        console.log(server)
        states[server] = {}
        states[server].status = "Offline"
        states[server].logs = ""
        states[server].options = {}
        states[server].serverPath = `servers/${server}`
        serverProperties(states[server])
    })
} catch (error) {
    states = {};
}

let publicIp = "0.0.0.0"
let localIp = ""

const options = {
	hostname: 'ifconfig.me', port: 443,
	family: 4,
	path: '/',
	method: 'GET'
};

let netInter = os.networkInterfaces()
Object.keys(netInter).forEach(inter => {
  // Filter out non-internal IPv4 addresses
  const device = netInter[inter].find(
    address => {
        return !address.internal && address.family === 'IPv4'
    }
  );

  if (device) {
      localIp = device.address
  }
});



const req = https.request(options, res => {
	res.on('data', d => {
		const split = String(d).split(/[\n, ]/)
		for (let i = 0; i < split.length; i += 1) {
			if (split[i].includes("ip_addr:")) {
				publicIp = split[i + 1]
			}
		}
	});
});

req.on('error', error => {
	console.error(error);
});

req.end();

function generateRandomPort() {
    return Math.floor(Math.random() * 65530)
}

// stealed from gemini
function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 18; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function serverProperties(state) { 
    let data = fs.readFileSync(`${state.serverPath}/server.properties`, 'utf-8')
    decode(data, state)
}

function encode(state) {
	let content = "";
	for (const option in state.options) {
		let formatedOpt = option.replace(/[_]/g, ".");
		formatedOpt = formatedOpt.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
		content += formatedOpt
		content += "="
		content += state.options[option]
		content += "\n"
	}

	fs.writeFile(`${state.serverPath}/server.properties`, content, err => { if (err) { console.error(err) } })
}

function decode(data, state) {
	const split = data.split(/[\n,=]/)
	for (let i = 0; i < split.length; i += 2) {
		if (i + 1 < split.length) {

			let option = split[i]
			if (option[0] == "#") {
				continue
			}
			if (option.includes("-")) {
				option = option.replace(/[-](\w)/g, (_, char) => char.toUpperCase());
			}
			if (option.includes(".")) {
				option = option.replace(/[.]/g, "_");
			}

			let value = split[i + 1];
			if (!isNaN(parseInt(value)) && isFinite(value)) {
				value = parseInt(value);
			} else if (value === "true") {
				value = true;
			} else if (value === "false") {
				value = false;
			}

			state.options[option] = value
		}
	}
}



//TODO: do the fs operations async with callbacks
function worldBackup(state) {
    const date = new Date()

    // format to count with the timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    const fileName = `${state.serverPath}/backups/${date.toJSON()}`
    function callback(err) {
        if (err) throw err;
        console.log('backup made successfully');
    }
    fs.cpSync(`${state.serverPath}/world`, fileName, { recursive:true } , callback)
}

export const server = {
    createServer: defineAction({
        input: z.object({
            name: z.string(),
            version: z.string(),
        }),
        handler: async (input) => {

            if(states.hasOwnProperty(input.name)) {
                console.log("could not create server, server name already exists")
                return
            } 
            
            states[input.name] = { 
                publicIp: publicIp,
                att: input.version,
                version: "Vanilla",
                status: "Offline",
                serverPath: `./servers/${input.name}`,
                logs: "",
                options: {},
            }

            fs.mkdirSync(`./servers/${input.name}`, {recursive: true})

            fs.cpSync("./server_defaults/server.properties", `${states[input.name].serverPath}/server.properties`)

            fs.cpSync("./server_defaults/eula.txt", `${states[input.name].serverPath}/eula.txt`)

            serverProperties(states[input.name])

            states[input.name].options.motd = input.name 
            states[input.name].options.gameVersion = input.version
            states[input.name].options.serverPort = generateRandomPort()
            states[input.name].options.rcon_port = generateRandomPort()
            states[input.name].options.rcon_password = generateRandomString()


            encode(states[input.name])

            let url = v[0].server_url;

            v.forEach((versionItem) => {
                if (versionItem.version == input.version) {
                    url = versionItem.server_url;
                }
            })

            
            // stealed from https://sebhastian.com/nodejs-download-file/
            https.get(url, (res) => {
                const path = `./servers/${input.name}/server.jar`;
                const writeStream = fs.createWriteStream(path);
                res.pipe(writeStream);
                writeStream.on("finish", () => {
                    writeStream.close();
                    console.log("Download Completed");
                    const cmd = spawn('java', ['-jar', './server.jar', '--nogui'], { cwd: `${states[input.name].serverPath}/` });
                    states[input.name].status = "Online";
                    cmd.stdout.on('data', (data) => {
                        states[input.name].logs = states[input.name].logs.concat(String(data));
                        console.log(states[input.name].logs);
                    });
                });
            });
		}
	}),
    getVersions: defineAction({
		handler: async () => {
            return v
		}
	}),
    getOptions: defineAction({
        input: z.string(),
		handler: async (input) => {
            return states[input].options
		}
	}),
    getServers: defineAction({
		handler: async () => {
            let servers = fs.readdirSync("./servers")
            return servers
		}
	}),
	start: defineAction({
        input: z.string(),
		handler: async (input) => {
			const cmd = spawn('java', ['-jar', './server.jar', '--nogui'], { cwd: `${states[input].serverPath}` });
			states[input].status = "Online";
			cmd.stdout.on('data', (data) => {
				states[input].logs = states[input].logs.concat(String(data));
				console.log(states[input].logs);
			});
		}
	}),
	stop: defineAction({
        input: z.string(),
		handler: async (input) => {
			const cmd = spawn(
                'rcon', [
                    '-H', 
                    'localhost',
                    '-p',
                    `${states[input].options.rcon_port}`,
                    '-P',
                    states[input].options.rcon_password,
                    'stop'
                ],
                { cwd: `${states[input].serverPath}` 
            });
			states[input].status = "Offline";
			cmd.stdout.on('data', (data) => {
				states[input].logs = states[input].logs.concat(String(data));
				console.log(states[input].logs);
			});
		}
	}),
	cmd: defineAction({
		input: z.object({
            name: z.string(),
            cmd: z.string(),
        }),
		handler: async (input) => {
            const cmd = spawn(
                'rcon', [
                    '-H', 
                    'localhost',
                    '-p',
                    `${states[input.name].options.rcon_port}`,
                    '-P',
                    states[input.name].options.rcon_password,
                    input.cmd 
                ],
                { cwd: `${states[input.name].serverPath}` 
            });
			cmd.stdout.on('data', (data) => {
				states[input.name].logs = states[input.name].logs.concat(String(data));
				console.log(states[input.name].logs);
			});
		}
	}),
	getInfo: defineAction({
        input: z.string(),
        handler: async (input) => {
            const req = https.request(options, res => {
                console.log(`statusCode: ${res.statusCode}`);
                res.on('data', d => {
                    const split = String(d).split(/[\n, ]/)
                    for (let i = 0; i < split.length; i += 1) {
                        if (split[i].includes("ip_addr:")) {
                            publicIp = split[i + 1]
                        }
                    }
                });
            });
            states[input].publicIp = publicIp
            states[input].localIp = localIp 
            return states[input]
        }
	}),
    deleteBackup: defineAction({
        input: z.object({
            name: z.string(),
            backupName: z.string(),
        }),
        handler:async (input) => {
            fs.rm(`${states[input.name].serverPath}/backups/${input.backupName}`, {recursive: true} , (err) => {
                if (err) throw err
                console.log(`backup ${input.backupName} was deleted sucessufully`)
            })
        }
    }),
    restoreBackup: defineAction({
        input: z.object({
            name: z.string(),
            backupName: z.string(),
        }),
        handler:async (input) => {
            worldBackup(states[input.name])
            if (states[input.name].status == "Offline") { 
                fs.rmSync(`${states[input.name].serverPath}/world`, {recursive: true} , (err) => {
                    if (err) throw err
                        console.log(`world was deleted sucessufully`)
                })
            } else {
                console.log(`Can not delete the world file while server in online`)
            }
            fs.cpSync(`${states[input.name].serverPath}/backups/${input.backupName}`, `${states[input.name].serverPath}/world/` , { recursive:true } , (err) => {
                if (err) throw err
                console.log(`backupo was restored sucessufully`)
            })
        }
    }),
    getBackups: defineAction({
        input: z.string(),
		handler: async (input) => {
            let f = [];
            fs.readdirSync(`${states[input].serverPath}/backups/`).forEach(file => {
                f.push(file)
            });
            f.reverse()
            console.log(f)

            return f
		}
	}),
    backup: defineAction({
        input: z.string(),
        handler: async (input) => {
            worldBackup(states[input])
        }
    }),
	changeOptions: defineAction({
        input: z.object({
            name: z.string(),
            options: z.string(),
        }),
		handler: async (input) => {
            states[input.name].options = JSON.parse(input.options)
			encode(states[input.name])
		},
	})
}
