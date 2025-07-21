<script>

import { actions } from "astro:actions"

let versions = $state([])
let version = $state()
let name = $state('')

const getVersions = async () => {
    const {data, err} = await actions.getVersions()
    versions = data
}

const createServer = async (name, version) => {
    await actions.createServer({name, version})
}

getVersions()

</script>

<input type="text" placeHolder="Server name" bind:value={name}/>
<select bind:value={version}>
    {#each versions as version}
    <option> {version.version} </option>
    {/each}
</select>
<button onclick={() => createServer(name,version)}> clickme </button>


