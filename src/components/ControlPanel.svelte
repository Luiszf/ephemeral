<script>
	import { actions } from "astro:actions";

	let logs = $state();
	let state = $state({});
	let consoleText = $state("");

	$effect(() => {
		setTimeout(() => {
			logs.scrollTo(0, logs.scrollHeight);
		}, 10);
	});

	const start = async () => {
		await actions.start();
		getData();
	};

	const stop = async () => {
		await actions.stop();
		setTimeout(getData, 1500);
	};

	const cmd = async () => {
		await actions.cmd(consoleText);
		setTimeout(getData, 1500);
	};
	const toClipboard = () => {
		navigator.clipboard.writeText(
			state.publicIp + ":" + state.serverPort,
		);
	};

	const getData = async () => {
		const { data, error } = await actions.getInfo();
		state = data;
		console.log(state);
	};

	getData();
</script>

<div id="menu">
	<h2 id="title">{state.motd}</h2>
	<div id="row">
		<p>{state.publicIp}:{state.serverPort}</p>
		<button
			onclick={toClipboard}
			style="background-color: #202020; border-width: 0px;"
		>
			<img
				id="copy"
				alt="copy ip to clipboad icon"
				src="copy.svg"
			/>
		</button>
	</div>

	<div id="row">
		<p>{state.version}</p>
		<p>{state.att}</p>
	</div>
	{#if state.status === "Online"}
		<p id="online">{state.status}</p>
	{/if}
	{#if state.status === "Offline"}
		<p id="offline">{state.status}</p>
	{/if}

	{#if state.status === "Online"}
		<button id="stop" onclick={stop}>stop</button>
	{/if}
	{#if state.status === "Offline"}
		<button id="start" onclick={start}>start</button>
	{/if}
</div>

<div id="menu">
	<form
		action=""
		onsubmit={(e) => {
			e.preventDefault();
			if (consoleText.length == 0) return;
			cmd();
			consoleText = "";
		}}
	>
		<textarea
			bind:this={logs}
			name=""
			class="h-96"
			id="console"
			readonly="true"
		>
			{state.logs}
		</textarea>

		<input type="text" id="console" bind:value={consoleText} />
	</form>
</div>

<style>
	.h-96 {
		height: 144px;
	}
	#console {
		background-color: #202020;
		color: #eeeeee;
		border-color: #eee;
		align-self: center;
		width: 100%;
		scrollbar-width: none;
		resize: none;
		padding: 2px;
		border-width: 2px;
	}
	#title {
		align-self: center;
	}
	#online {
		align-self: center;
		padding: 8px;
		background-color: #149914;
		border-radius: 4px;
	}
	#offline {
		align-self: center;
		padding: 8px;
		background-color: #991414;
		border-radius: 4px;
	}
	#start {
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		background-color: #202020;
		color: #eeeeee;
		border-color: #eee;
		font-size: 2rem;
	}
	#start:hover {
		background-color: #149914;
	}
	#stop {
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		background-color: #242424;
		color: #eeeeee;
		border-color: #eee;
		font-size: 2rem;
	}
	#stop:hover {
		background-color: #991414;
	}
	#menu {
		display: flex;
		padding: 24px;
		flex-direction: column;
		background-color: #202020;
		border-radius: 8px;
		margin-top: 24px;
	}
	#row {
		display: flex;
		justify-content: space-between;
	}
</style>
