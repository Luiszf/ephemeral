import { defineAction } from "astro:actions";
import { spawn } from "node:child_process";
import https from "node:https";
import { z } from "astro:schema";

let state = {
	publicIp: "0.0.0.0",
	att: "1.21.5",
	version: "Vanilla",
	status: "Offline",
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
	const split = data.split(/[\n,=]/)

	for (let i = 0; i < split.length; i += 2) {
		if (i + 1 < split.length) {

			let option = split[i]
			if (option[0] == "#") {
				continue
			}
			if (option.includes("-") || option.includes(".")) {
				option = option.replace(/[-.](\w)/g, (_, char) => char.toUpperCase());
			}

			let value = split[i + 1];
			if (!isNaN(parseInt(value)) && isFinite(value)) {
				value = parseInt(value);
			} else if (value === "true") {
				value = true;
			} else if (value === "false") {
				value = false;
			}

			state[option] = value
		}
	}
})


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
	})
}
