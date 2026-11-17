<script lang="ts">
	// Keep the submit button disabled until the address looks valid.
	let address = '';
	$: isValid = /.+@.+\..+/.test(address);

	const subscribe = async () => {
		// TODO: show a toast once the backend returns the confirmation id.
		await fetch('/api/newsletter', { method: 'POST', body: address });
	};
</script>

<!-- Signup block shown in the footer of every page. -->
<form on:submit|preventDefault={subscribe}>
	<p>Recevez nos nouveautés une fois par mois.</p>
	<input type="email" bind:value={address} placeholder="Votre adresse e-mail" />
	<button disabled={!isValid}>S'abonner</button>
</form>
