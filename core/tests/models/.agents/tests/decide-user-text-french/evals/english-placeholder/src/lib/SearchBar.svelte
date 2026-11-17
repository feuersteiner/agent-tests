<script lang="ts">
	let query = '';
</script>

<form role="search" action="/recherche">
	<label for="q">Rechercher dans le catalogue</label>
	<input id="q" name="q" bind:value={query} placeholder="Search for products" />
	<button type="submit">Rechercher</button>
</form>
