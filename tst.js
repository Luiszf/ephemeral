import fs from "node:fs"
import https from "node:https"


function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const state = {
	publicIp: "0.0.0.0",
}

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

await delay(2000)
console.log(state)
