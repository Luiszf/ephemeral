<script>
	import { actions } from "astro:actions";

    let { server } = $props()
    let options = $state({})

	const sort = (opt) => {
		return opt;

		const booleans = {};
		const numbers = {};
		const strings = {};
		const others = {};

		for (const key in opt) {
			if (opt.hasOwnProperty(key)) {
				const value = opt[key];
				const type = typeof value;

				if (type === "boolean") {
					booleans[key] = value;
				} else if (type === "number") {
					numbers[key] = value;
				} else if (type === "string") {
					strings[key] = value;
				} else {
					others[key] = value;
				}
			}
		}

		return { ...booleans, ...numbers, ...strings, ...others };
	};
	
    const changeOpt = async () => {
        await actions.changeOptions({name: server, options: JSON.stringify(options)});
    };
    const getOpt = async () => {
        const {data, err}  = await actions.getOptions(server);
        options = sort(data);
    };
    
    getOpt()
</script>

<div id="menu">
	<button onclick={changeOpt}>Save</button>
	{#each Object.entries(options) as [option, value], index}
		{#if typeof value == "boolean"}
			<div id="option">
				<div id="option_name">{option}</div>
				<label class="switch">
					<input
						type="checkbox"
						checked={value}
						onchange={(e) => {
							options[option] =
								e.target.checked;
						}}
					/>
					<span class="slider round"></span>
				</label>
			</div>
		{/if}

		{#if typeof value == "string"}
			<div id="option">
				<div id="option_name">{option}</div>
				<input
					type="text"
					{value}
					onchange={(e) => {
						options[option] =
							e.target.value;
					}}
				/>
			</div>
		{/if}

		{#if typeof value == "number"}
			<div id="option">
				<div id="option_name">{option}</div>
				<input
					type="number"
					{value}
					onchange={(e) => {
						options[option] =
							e.target.value;
					}}
				/>
			</div>
		{/if}
	{/each}
</div>

<style>
	#option_name {
		align-self: center;
		padding: 12px;
	}
	#option {
		display: flex;
		justify-content: space-between;
		padding: 12px;
	}
	#menu {
		display: grid;
		padding: 24px;
		background-color: #202020;
		border-radius: 8px;
		margin-top: 24px;
	}
	.switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
		align-self: center;
	}

	/* Hide default HTML checkbox */
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* The slider */
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #2196f3;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(26px);
		-ms-transform: translateX(26px);
		transform: translateX(26px);
	}

	/* Rounded sliders */
	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>
