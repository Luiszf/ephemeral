<script>
import { actions } from "astro:actions"

let servers = $state([])

const getServers = async () => {
    const {data, err} = await actions.getServers();
    servers = data
}

getServers()
</script>


<div class="flex">
<a id="button" href="/create">Create Server</a>

<div>
</div>

<div id="list">
    {#each servers as name}
    <a id="refs" href={`${name}/panel`}>
        <div id="item">{name}</div>
    </a>
    {/each}
</div>

</div>
<style>
.flex {
    display:flex;
    flex-direction: column;
    gap: 0.5rem
}
#button{
    cursor: pointer;
    background-color: #181818;
    padding: 0.5rem;
    color: #eeeeee;
    border-color: #eee;
    font-size: 1.75rem;
    border-width: 0px;
    border-radius: 0.25rem;
}
a:link,
a:visited {
    color: #eeeeee;
    text-decoration: none;
    text-align: center;
}
#item:hover {
    background-color: #242424
} 

#list {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr 1fr
}

#item {
    padding: 1rem;
    background-color: #181818;
    border-radius: 0.5rem;
} 


</style>
