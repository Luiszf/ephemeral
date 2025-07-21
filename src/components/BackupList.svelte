<script>
import { actions } from "astro:actions";
let { server } = $props();

let backupList = $state([])

const deleteBackup = async (backupName) => {
		await actions.deleteBackup({name: server, backupName: backupName});
        await getBackups();
};

const restoreBackup = async (backupName) => {
		await actions.restoreBackup({name: server, backupName: backupName});
        await getBackups();
};

const backup = async () => {
		await actions.backup(server);
        await getBackups();
};

const getBackups = async () => {
		const { data, err } = await actions.getBackups(server);
        backupList = data
};

getBackups()

</script>

<h1> Backups </h1>
<div class="flex">
    <button class="button" onclick={() => backup() }>Backup</button>
</div>
<ul>
    {#each backupList as backupName}
    <li class="flex center">
        <div class="flex center">
            <div>{backupName}</div>
        </div>
        <div class="flex">
            <div class="flex bg-gray">
                <button class="itemButton" onclick={() => restoreBackup(backupName) }>
                    <img src="/sync_arrow_up.svg">
                </button>
                <button class="itemButton" onclick={() => deleteBackup(backupName) }>
                    <img src="/delete.svg">
                </button>
            </div>
        </div>
    </li>
    {/each}
</ul>
<style>
.button{
    cursor: pointer;
    background-color: #202020;
    padding: 0.5rem;
    color: #eeeeee;
    border-color: #eee;
    font-size: 1.75rem;
    border-width: 0px;
    border-radius: 0.25rem;
}
.itemButton {
    background-color:#202020; 
    border-width: 0px;
}
.flex {
    display: flex;
    justify-content: space-between;
}
.center {
    align-items: center;
}
.bg-gray {
    background-color: #202020; 
}
.listItem {
    display: flex;
    justify-content: space-between;
    border-color: #eee;
    padding: 0.25rem;
    margin: 0.25rem;
    border-radius: 0.25rem;
}
</style>
