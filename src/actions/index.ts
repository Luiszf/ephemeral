import { defineAction } from "astro:actions";
import { spawn } from "node:child_process";
import https from "node:https";
import { z } from "astro:schema";

let state = {
	publicIp: "0.0.0.0",
	att: "1.21.5",
	version: "Vanilla",
	status: "Offline",
	options: {},
};

const options = {
	hostname: 'ifconfig.me', port: 443,
	family: 4,
	path: '/',
	method: 'GET'
};

const req = https.request(options, res => {
	console.log(`statusCode: ${res.statusCode}`);

	res.on('data', d => {
		const split = String(d).split(/[\n, ]/)
		for (let i = 0; i < split.length; i += 1) {
			if (split[i].includes("ip_addr:")) {
				state.publicIp = split[i + 1]
			}
		}
	});
});

req.on('error', error => {
	console.error(error);
});

req.end();

fs.readFile('servidor/server.properties', 'utf8', (err, data) => {
	decode(data)
})

function encode(path: String) {
	let content = "";
	for (const option in state.options) {
		let formatedOpt = option.replace(/[_]/g, ".");
		formatedOpt = formatedOpt.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
		content += formatedOpt
		content += "="
		content += state.options[option]
		content += "\n"
	}

	fs.writeFile(path, content, err => { if (err) { console.error(err) } })
}

function decode(data) {
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
function worldBackup() {
    const date = new Date()

    // format to count with the timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    const fileName = `./backups/${date.toJSON()}`
    console.log(fileName)
    function callback(err) {
        if (err) throw err;
        console.log('backup made successfully');
    }
    fs.cpSync("./servidor/world", fileName, { recursive:true } , callback)
}

export const server = {
	start: defineAction({
		handler: async () => {
			const cmd = spawn('java', ['-jar', './server.jar', '--nogui'], { cwd: "./servidor/" });
			state.status = "Online";
			cmd.stdout.on('data', (data) => {
				state.logs = state.logs.concat(String(data));
				console.log(state.logs);
			});
		}
	}),
	stop: defineAction({
		handler: async () => {
			const cmd = spawn('rcon', ['-a', '127.0.0.1:25575', '-p', 'qualquercoisa', 'stop'], { cwd: "./servidor/" });
			state.status = "Offline";
			cmd.stdout.on('data', (data) => {
				state.logs = state.logs.concat(String(data));
				console.log(state.logs);
			});
		}
	}),
	cmd: defineAction({
		input: z.string(),
		handler: async (input) => {
			const cmd = spawn('rcon', ['-a', '127.0.0.1:25575', '-p', 'qualquercoisa', input], { cwd: "./servidor/" });
			cmd.stdout.on('data', (data) => {
				state.logs = state.logs.concat(String(data));
				console.log(state.logs);
			});
		}
	}),
	getInfo: defineAction({
		handler: async () => {
			return state
		}
	}),
    deleteBackup: defineAction({
        handler:async (backupName: String) => {
            fs.rm(`./backups/${backupName}`, {recursive: true} , (err) => {
                if (err) throw err
                console.log(`backup ${backupName} was deleted sucessufully`)
            })
        }
    }),
    restoreBackup: defineAction({
        handler:async (backupName: String) => {
            worldBackup()
            if (state.status == "Offline") { 
                fs.rmSync(`./servidor/world`, {recursive: true} , (err) => {
                    if (err) throw err
                        console.log(`world was deleted sucessufully`)
                })
            } else {
                console.log(`Can not delete the world file while server in online`)
            }
            fs.cpSync(`./backups/${backupName}`, `./servidor/world/` , { recursive:true } , (err) => {
                if (err) throw err
                console.log(`backupo was restored sucessufully`)
            })
        }
    }),
    getBackups: defineAction({
		handler: async () => {
            let f = [];
            fs.readdirSync("./backups/").forEach(file => {
                f.push(file)
            });
            f.reverse()
            console.log(f)

            return f
		}
	}),
    backup: defineAction({
        handler: async () => {
            worldBackup()
        }
    }),
	changeOptions: defineAction({
		handler: async (input) => {
			state.options = input;
			encode("servidor/server.properties")
		},
	})
}
